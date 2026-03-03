package com.ecommerce.service;

import com.ecommerce.dto.CustomerLoanRequest;
import com.ecommerce.dto.CustomerLoanRequestDTO;
import com.ecommerce.dto.GoldItemDTO;
import com.ecommerce.model.Customer;
import com.ecommerce.model.CustomerLoan;
import com.ecommerce.model.CustomerLoan.InterestAccrual;
import com.ecommerce.model.GoldItem;
import com.ecommerce.model.User;
import com.ecommerce.repository.CustomerLoanRepository;
import com.ecommerce.repository.CustomerRepository;
import com.ecommerce.repository.GoldItemRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.utils.DateUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerLoanService {

    private final CustomerLoanRepository customerLoanRepository;
    private final GoldItemRepository goldItemRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final SmsService smsService;
    private final InterestCalculationService interestCalculationService;
    private final NotificationService notificationService;

    @Transactional
    public CustomerLoan createLoan(CustomerLoanRequest request) {
        List<GoldItem> goldItems = goldItemRepository.findAllById(request.getGoldItemIds());

        for (GoldItem item : goldItems) {
            if (!item.getCustomerId().equals(request.getCustomerId())) {
                throw new RuntimeException("Gold item " + item.getId() + " does not belong to this customer");
            }
            if (!"AVAILABLE".equals(item.getStatus())) {
                throw new RuntimeException("Gold item " + item.getId() + " is not available");
            }
        }

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        CustomerLoan loan = new CustomerLoan();
        loan.setCustomerId(request.getCustomerId());

        if (request.getAutoGenerateSerialNumber() || request.getCustomerSerialNumber() == null) {
            loan.setCustomerSerialNumber(generateCustomerSerialNumber());
            loan.setLoanNumber("CL-" + loan.getCustomerSerialNumber());
        } else {
            Optional<CustomerLoan> existingLoan = customerLoanRepository
                    .findByCustomerSerialNumber(request.getCustomerSerialNumber());
            if (existingLoan.isPresent()) {
                throw new RuntimeException("Customer serial number already exists: " + request.getCustomerSerialNumber());
            }
            loan.setCustomerSerialNumber(request.getCustomerSerialNumber());
            loan.setLoanNumber("CL-" + request.getCustomerSerialNumber());
        }

        loan.setPrincipalAmount(request.getPrincipalAmount());
        loan.setInterestRate(request.getInterestRate());
        loan.setTenureMonths(request.getTenureMonths());
        loan.setStartDate(LocalDateTime.now());
        loan.setMaturityDate(LocalDateTime.now().plusMonths(request.getTenureMonths()));
        loan.setStatus("ACTIVE");
        loan.setGoldItemIds(request.getGoldItemIds());
        loan.setJewelleryPictures(request.getJewelleryPictures());
        loan.setBillAttachments(request.getBillAttachments());
        loan.setIsBulkLoan(request.getIsBulkLoan() != null ? request.getIsBulkLoan() : false);

        loan.setInterestType(request.getInterestType() != null ? request.getInterestType() : "SIMPLE");

        double totalInterest;
        if ("COMPOUND".equals(loan.getInterestType())) {
            loan.setCompoundingFrequency(request.getCompoundingFrequency() != null ?
                    request.getCompoundingFrequency() : 12);

            totalInterest = interestCalculationService.calculateCompoundInterest(
                    request.getPrincipalAmount(),
                    request.getInterestRate(),
                    loan.getCompoundingFrequency(),
                    request.getTenureMonths()
            );
        } else {
            loan.setMonthlyInterestRate(request.getInterestRate());
            totalInterest = interestCalculationService.calculateSimpleInterest(
                    request.getPrincipalAmount(),
                    request.getInterestRate(),
                    request.getTenureMonths()
            );
        }

        loan.setTotalInterestReceivable(totalInterest);
        loan.setInterestPaidSoFar(0.0);
        loan.setAccruedInterest(0.0);
        loan.setAmountPaidSoFar(0.0);
        loan.setOutstandingAmount(request.getPrincipalAmount());
        loan.setLastPaymentDate(LocalDateTime.now());
        loan.setLastInterestCalculationDate(LocalDateTime.now());
        loan.setSmsNotifications(true);

        loan.setFormattedStartDate(DateUtil.getFormattedDates(loan.getStartDate()));
        loan.setFormattedMaturityDate(DateUtil.getFormattedDates(loan.getMaturityDate()));

        List<Map<String, Object>> goldItemsDetails = goldItems.stream()
                .map(item -> {
                    Map<String, Object> details = new HashMap<>();
                    details.put("id", item.getId());
                    details.put("itemType", item.getItemType());
                    details.put("weightInGrams", item.getWeightInGrams());
                    details.put("purity", item.getPurity());
                    details.put("estimatedValue", item.getEstimatedValue());
                    details.put("serialNumber", item.getSerialNumber());
                    details.put("imageUrl", item.getImageUrl());
                    return details;
                })
                .collect(Collectors.toList());
        loan.setGoldItemsDetails(goldItemsDetails);

        List<InterestAccrual> accrualSchedule = interestCalculationService.generateAccrualSchedule(loan);
        loan.setInterestAccruals(accrualSchedule);

        loan.setCreatedAt(LocalDateTime.now());
        loan.setUpdatedAt(LocalDateTime.now());

        for (GoldItem item : goldItems) {
            item.setStatus("PLEDGED");
            item.setCustomerLoanId(loan.getId());
            item.setUpdatedAt(LocalDateTime.now());
            goldItemRepository.save(item);
        }

        CustomerLoan savedLoan = customerLoanRepository.save(loan);

        sendLoanCreationSms(savedLoan, customer);

        return savedLoan;
    }

    @Transactional
    public CustomerLoan createCustomerLoanRequest(String customerId, CustomerLoanRequestDTO request) {

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        List<GoldItem> newGoldItems = new ArrayList<>();
        Double totalEstimatedValue = 0.0;

        if (request.getGoldItems() != null && !request.getGoldItems().isEmpty()) {
            for (GoldItemDTO itemDTO : request.getGoldItems()) {
                GoldItem goldItem = new GoldItem();
                goldItem.setCustomerId(customerId);
                goldItem.setItemType(itemDTO.getItemType());
                goldItem.setWeightInGrams(itemDTO.getWeightInGrams());
                goldItem.setPurity(itemDTO.getPurity());
                goldItem.setDescription(itemDTO.getDescription());
                goldItem.setEstimatedValue(itemDTO.getEstimatedValue());
                goldItem.setSerialNumber(itemDTO.getSerialNumber());
                goldItem.setImageUrl(itemDTO.getImageUrl());
                goldItem.setBillAttachments(itemDTO.getBillAttachments());
                goldItem.setStatus("AVAILABLE");
                goldItem.setCreatedAt(LocalDateTime.now());
                goldItem.setUpdatedAt(LocalDateTime.now());

                GoldItem savedItem = goldItemRepository.save(goldItem);
                newGoldItems.add(savedItem);
                totalEstimatedValue += itemDTO.getEstimatedValue();
            }
        }

        Double interestRate = 2.0;

        CustomerLoan loan = new CustomerLoan();
        loan.setCustomerId(customerId);
        loan.setCustomerSerialNumber(generateCustomerSerialNumber());
        loan.setLoanNumber("CL-" + loan.getCustomerSerialNumber());
        loan.setPrincipalAmount(request.getPrincipalAmount());
        loan.setInterestRate(interestRate);
        loan.setTenureMonths(request.getTenureMonths());
        loan.setStartDate(LocalDateTime.now());
        loan.setMaturityDate(LocalDateTime.now().plusMonths(request.getTenureMonths()));
        loan.setStatus("PENDING_APPROVAL");
        loan.setGoldItemIds(newGoldItems.stream().map(GoldItem::getId).collect(Collectors.toList()));
        loan.setIsBulkLoan(false);

        loan.setInterestType("SIMPLE");
        loan.setMonthlyInterestRate(interestRate);

        double totalInterest = interestCalculationService.calculateSimpleInterest(
                request.getPrincipalAmount(),
                interestRate,
                request.getTenureMonths()
        );

        loan.setTotalInterestReceivable(totalInterest);
        loan.setInterestPaidSoFar(0.0);
        loan.setAccruedInterest(0.0);
        loan.setAmountPaidSoFar(0.0);
        loan.setOutstandingAmount(request.getPrincipalAmount());
        loan.setLastPaymentDate(LocalDateTime.now());
        loan.setLastInterestCalculationDate(LocalDateTime.now());
        loan.setSmsNotifications(true);

        loan.setFormattedStartDate(DateUtil.getFormattedDates(loan.getStartDate()));
        loan.setFormattedMaturityDate(DateUtil.getFormattedDates(loan.getMaturityDate()));

        List<Map<String, Object>> goldItemsDetails = newGoldItems.stream()
                .map(item -> {
                    Map<String, Object> details = new HashMap<>();
                    details.put("id", item.getId());
                    details.put("itemType", item.getItemType());
                    details.put("weightInGrams", item.getWeightInGrams());
                    details.put("purity", item.getPurity());
                    details.put("estimatedValue", item.getEstimatedValue());
                    details.put("serialNumber", item.getSerialNumber());
                    details.put("imageUrl", item.getImageUrl());
                    details.put("billAttachments", item.getBillAttachments());
                    return details;
                })
                .collect(Collectors.toList());
        loan.setGoldItemsDetails(goldItemsDetails);

        List<InterestAccrual> accrualSchedule = interestCalculationService.generateAccrualSchedule(loan);
        loan.setInterestAccruals(accrualSchedule);

        loan.setCreatedAt(LocalDateTime.now());
        loan.setUpdatedAt(LocalDateTime.now());

        CustomerLoan savedLoan = customerLoanRepository.save(loan);

        notificationService.createLoanRequestNotification(savedLoan, customer.getFullName());

        System.out.println("Loan request created with ID: " + savedLoan.getId() + " - Status: PENDING_APPROVAL");

        return savedLoan;
    }

    @Transactional
    public CustomerLoan approveLoan(String loanId, String approverId, String approverName) {
        CustomerLoan loan = getLoanById(loanId);

        if (!"PENDING_APPROVAL".equals(loan.getStatus())) {
            throw new RuntimeException("Loan is not in pending approval state");
        }

        loan.setStatus("ACTIVE");
        loan.setApprovedBy(approverId);
        loan.setApprovalDate(LocalDateTime.now());
        loan.setReviewedBy(approverName);
        loan.setUpdatedAt(LocalDateTime.now());

        if (loan.getGoldItemIds() != null) {
            for (String itemId : loan.getGoldItemIds()) {
                goldItemRepository.findById(itemId).ifPresent(item -> {
                    item.setStatus("PLEDGED");
                    item.setCustomerLoanId(loan.getId());
                    item.setUpdatedAt(LocalDateTime.now());
                    goldItemRepository.save(item);
                });
            }
        }

        CustomerLoan approvedLoan = customerLoanRepository.save(loan);

        customerRepository.findById(loan.getCustomerId()).ifPresent(customer -> {
            notificationService.createLoanApprovedNotification(approvedLoan, customer.getId(), approverName);
            sendLoanApprovalSms(approvedLoan, customer);
        });

        return approvedLoan;
    }

    @Transactional
    public CustomerLoan rejectLoan(String loanId, String rejectionReason, String reviewerName) {
        CustomerLoan loan = getLoanById(loanId);

        if (!"PENDING_APPROVAL".equals(loan.getStatus())) {
            throw new RuntimeException("Loan is not in pending approval state");
        }

        loan.setStatus("REJECTED");
        loan.setRejectionReason(rejectionReason);
        loan.setReviewedBy(reviewerName);
        loan.setUpdatedAt(LocalDateTime.now());

        CustomerLoan rejectedLoan = customerLoanRepository.save(loan);

        customerRepository.findById(loan.getCustomerId()).ifPresent(customer -> {
            notificationService.createLoanRejectedNotification(rejectedLoan, customer.getId(), rejectionReason, reviewerName);
            sendLoanRejectionSms(rejectedLoan, customer, rejectionReason);
        });

        return rejectedLoan;
    }

    public List<CustomerLoan> getPendingApprovalLoans() {
        return customerLoanRepository.findByStatus("PENDING_APPROVAL");
    }

    public boolean canUserApproveLoan(String userId, Double loanAmount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getCanApproveLoans()) {
            return false;
        }

        if (user.getMaxLoanApprovalLimit() != null && loanAmount > user.getMaxLoanApprovalLimit()) {
            return false;
        }

        return true;
    }

    @Transactional
    public CustomerLoan processRepayment(String loanId, Double amount) {
        CustomerLoan loan = customerLoanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        if (!"ACTIVE".equals(loan.getStatus())) {
            throw new RuntimeException("Loan is not active");
        }

        loan.setAmountPaidSoFar(loan.getAmountPaidSoFar() + amount);
        loan.setOutstandingAmount(loan.getPrincipalAmount() - loan.getAmountPaidSoFar());
        loan.setLastPaymentDate(LocalDateTime.now());
        loan.setUpdatedAt(LocalDateTime.now());

        double interestPaid = amount * (loan.getInterestRate() / 100);
        loan.setInterestPaidSoFar(loan.getInterestPaidSoFar() + interestPaid);

        if (loan.getOutstandingAmount() <= 0) {
            loan.setStatus("CLOSED");
            releaseGoldItems(loan.getGoldItemIds());
        }

        CustomerLoan updatedLoan = customerLoanRepository.save(loan);

        customerRepository.findById(loan.getCustomerId()).ifPresent(customer -> {
            sendPaymentSms(updatedLoan, amount, customer);
        });

        return updatedLoan;
    }

    @Transactional
    public void updateAccruedInterest(String loanId) {
        CustomerLoan loan = getLoanById(loanId);

        if (!"ACTIVE".equals(loan.getStatus())) {
            return;
        }

        double accruedInterest = interestCalculationService.calculateAccruedInterest(
                loan, LocalDateTime.now());
        loan.setAccruedInterest(accruedInterest);
        loan.setLastInterestCalculationDate(LocalDateTime.now());
        loan.setUpdatedAt(LocalDateTime.now());

        customerLoanRepository.save(loan);
    }

    @Transactional
    public void updateAllActiveLoansInterest() {
        List<CustomerLoan> activeLoans = getAllActiveLoans();
        for (CustomerLoan loan : activeLoans) {
            updateAccruedInterest(loan.getId());
        }
    }

    public List<CustomerLoan> getAllActiveLoans() {
        return customerLoanRepository.findByStatus("ACTIVE");
    }

    public List<CustomerLoan> getCustomerLoans(String customerId) {
        return customerLoanRepository.findByCustomerId(customerId);
    }

    public CustomerLoan getLoanById(String id) {
        return customerLoanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan not found"));
    }

    public CustomerLoan getLoanByCustomerSerialNumber(String serialNumber) {
        return customerLoanRepository.findByCustomerSerialNumber(serialNumber)
                .orElseThrow(() -> new RuntimeException("Loan not found with serial number: " + serialNumber));
    }

    public List<CustomerLoan> searchLoansBySerialNumber(String serialNumber) {
        return customerLoanRepository.searchByCustomerSerialNumber(serialNumber);
    }

    public List<CustomerLoan> searchLoans(String searchTerm) {
        return customerLoanRepository.searchLoans(searchTerm);
    }

    public List<CustomerLoan> getExpiredLoans() {
        return customerLoanRepository.findExpiredLoans(LocalDateTime.now());
    }

    public Double getTotalReceivableInterest() {
        List<CustomerLoan> activeLoans = customerLoanRepository.findByStatus("ACTIVE");
        return activeLoans.stream()
                .mapToDouble(CustomerLoan::getTotalInterestReceivable)
                .sum();
    }

    public Double getTotalInvestment() {
        List<CustomerLoan> activeLoans = customerLoanRepository.findByStatus("ACTIVE");
        return activeLoans.stream()
                .mapToDouble(CustomerLoan::getPrincipalAmount)
                .sum();
    }

    public Map<String, Object> getCustomerInterestProfile(String customerId) {
        List<CustomerLoan> loans = customerLoanRepository.findByCustomerId(customerId);
        Map<String, Object> profile = new HashMap<>();

        List<Map<String, Object>> loanProfiles = loans.stream().map(loan -> {
            Map<String, Object> loanProfile = new HashMap<>();
            loanProfile.put("loanId", loan.getId());
            loanProfile.put("loanNumber", loan.getLoanNumber());
            loanProfile.put("customerSerialNumber", loan.getCustomerSerialNumber());
            loanProfile.put("principalAmount", loan.getPrincipalAmount());
            loanProfile.put("interestRate", loan.getInterestRate());
            loanProfile.put("interestType", loan.getInterestType());
            loanProfile.put("startDate", loan.getFormattedStartDate());
            loanProfile.put("maturityDate", loan.getFormattedMaturityDate());
            loanProfile.put("status", loan.getStatus());

            double accruedInterest = interestCalculationService.calculateAccruedInterest(
                    loan, LocalDateTime.now());
            loanProfile.put("accruedInterest", accruedInterest);
            loanProfile.put("interestPaidSoFar", loan.getInterestPaidSoFar());
            loanProfile.put("outstandingAmount", loan.getOutstandingAmount());

            long daysElapsed = DateUtil.getDaysBetween(loan.getStartDate(), LocalDateTime.now());
            loanProfile.put("daysElapsed", daysElapsed);

            long totalDays = DateUtil.getDaysBetween(loan.getStartDate(), loan.getMaturityDate());
            loanProfile.put("totalDays", totalDays);

            double percentComplete = totalDays > 0 ? (daysElapsed * 100.0) / totalDays : 0;
            loanProfile.put("percentComplete", Math.min(percentComplete, 100));

            return loanProfile;
        }).collect(Collectors.toList());

        profile.put("loans", loanProfiles);
        profile.put("totalLoans", loans.size());
        profile.put("activeLoans", loans.stream().filter(l -> "ACTIVE".equals(l.getStatus())).count());
        profile.put("closedLoans", loans.stream().filter(l -> "CLOSED".equals(l.getStatus())).count());
        profile.put("asOfDate", DateUtil.getFormattedDates(LocalDateTime.now()));

        return profile;
    }

    public List<InterestAccrual> getLoanInterestSchedule(String loanId) {
        CustomerLoan loan = getLoanById(loanId);
        return interestCalculationService.generateAccrualSchedule(loan);
    }

    private String generateCustomerSerialNumber() {
        String prefix = "CSN";
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String serialNumber = prefix + "-" + datePart + "-" + randomPart;

        while (customerLoanRepository.findByCustomerSerialNumber(serialNumber).isPresent()) {
            randomPart = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            serialNumber = prefix + "-" + datePart + "-" + randomPart;
        }
        return serialNumber;
    }

    private String generateLoanNumber() {
        return "CL-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) +
                "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private void releaseGoldItems(List<String> goldItemIds) {
        for (String itemId : goldItemIds) {
            goldItemRepository.findById(itemId).ifPresent(item -> {
                item.setStatus("AVAILABLE");
                item.setCustomerLoanId(null);
                item.setUpdatedAt(LocalDateTime.now());
                goldItemRepository.save(item);
            });
        }
    }

    private void sendLoanCreationSms(CustomerLoan loan, Customer customer) {
        String phoneNumber = customer.getPhoneNumber();
        String message = String.format(
                "Your gold loan of NPR %.2f has been approved. Loan Number: %s. Serial Number: %s. Maturity Date: %s",
                loan.getPrincipalAmount(),
                loan.getLoanNumber(),
                loan.getCustomerSerialNumber(),
                loan.getMaturityDate().toLocalDate().toString()
        );
        smsService.sendSms(phoneNumber, message, "LOAN_CREATION", loan.getId());
    }

    private void sendLoanApprovalSms(CustomerLoan loan, Customer customer) {
        String phoneNumber = customer.getPhoneNumber();
        String message = String.format(
                "Congratulations! Your loan request %s for NPR %.2f has been approved. It is now active.",
                loan.getLoanNumber(),
                loan.getPrincipalAmount()
        );
        smsService.sendSms(phoneNumber, message, "LOAN_APPROVED", loan.getId());
    }

    private void sendLoanRejectionSms(CustomerLoan loan, Customer customer, String reason) {
        String phoneNumber = customer.getPhoneNumber();
        String message = String.format(
                "Your loan request %s for NPR %.2f has been rejected. Reason: %s",
                loan.getLoanNumber(),
                loan.getPrincipalAmount(),
                reason
        );
        smsService.sendSms(phoneNumber, message, "LOAN_REJECTED", loan.getId());
    }

    private void sendPaymentSms(CustomerLoan loan, Double amount, Customer customer) {
        String phoneNumber = customer.getPhoneNumber();
        String message = String.format(
                "Payment of NPR %.2f received for loan %s. Outstanding: NPR %.2f",
                amount,
                loan.getLoanNumber(),
                loan.getOutstandingAmount()
        );
        smsService.sendSms(phoneNumber, message, "PAYMENT_RECEIVED", loan.getId());
    }

    public Long getPendingApprovals() {
        return customerLoanRepository.countByStatus("PENDING_APPROVAL");
    }

}