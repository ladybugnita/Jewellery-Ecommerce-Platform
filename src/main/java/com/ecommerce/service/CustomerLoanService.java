package com.ecommerce.service;

import com.ecommerce.dto.CustomerLoanRequest;
import com.ecommerce.model.Customer;
import com.ecommerce.model.CustomerLoan;
import com.ecommerce.model.GoldItem;
import com.ecommerce.model.User;
import com.ecommerce.repository.CustomerLoanRepository;
import com.ecommerce.repository.CustomerRepository;
import com.ecommerce.repository.GoldItemRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerLoanService {
    private final CustomerLoanRepository customerLoanRepository;
    private final GoldItemRepository goldItemRepository;
    private final CustomerRepository customerRepository;
    private final SmsService smsService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private String getCustomerName(String customerId) {
        return customerRepository.findById(customerId)
                .map(Customer::getFullName)
                .orElse(customerId);
    }

    private void notifyAllAdmins(String title, String message, String type, String referenceId) {
        List<User> admins = userRepository.findByRole("ADMIN");
        for (User admin : admins) {
            notificationService.createNotification(
                    admin.getId(),
                    title,
                    message,
                    type,
                    referenceId
            );
        }
    }

    private void notifyAllAdmins(String title, String message, String type, String referenceId, Map<String, Object> data) {
        List<User> admins = userRepository.findByRole("ADMIN");
        for (User admin : admins) {
            notificationService.createNotification(
                    admin.getId(),
                    title,
                    message,
                    type,
                    referenceId,
                    data
            );
        }
    }

    private double calculateCompoundInterest(double principal, double annualRate, int tenureMonths) {
        double monthlyRate = annualRate / 12 / 100;
        double monthlyPrincipal = principal / tenureMonths;
        double totalInterest = 0.0;
        double remainingPrincipal = principal;

        for (int month = 1; month <= tenureMonths; month++) {
            double interestForMonth = remainingPrincipal * monthlyRate;
            totalInterest += interestForMonth;
            remainingPrincipal -= monthlyPrincipal;
        }
        return totalInterest;
    }

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

        CustomerLoan loan = new CustomerLoan();
        loan.setCustomerId(request.getCustomerId());
        loan.setLoanNumber(generateLoanNumber());
        loan.setPrincipalAmount(request.getPrincipalAmount());
        loan.setInterestRate(request.getInterestRate());
        loan.setTenureMonths(request.getTenureMonths());
        LocalDateTime now = LocalDateTime.now();
        loan.setStartDate(now);
        loan.setMaturityDate(now.plusMonths(request.getTenureMonths()));
        loan.setStatus("ACTIVE");
        loan.setGoldItemIds(request.getGoldItemIds());

        double totalInterest = calculateCompoundInterest(
                request.getPrincipalAmount(),
                request.getInterestRate(),
                request.getTenureMonths()
        );
        loan.setTotalInterestReceivable(totalInterest);

        loan.setInterestPaidSoFar(0.0);
        loan.setAmountPaidSoFar(0.0);
        loan.setOutstandingAmount(request.getPrincipalAmount());
        loan.setLastPaymentDate(now);
        loan.setSmsNotifications(true);
        loan.setInterestType("COMPOUND");

        for (GoldItem item : goldItems) {
            item.setStatus("PLEDGED");
            goldItemRepository.save(item);
        }

        CustomerLoan savedLoan = customerLoanRepository.save(loan);
        String customerName = getCustomerName(request.getCustomerId());

        Map<String, Object> data = new HashMap<>();
        data.put("customerName", customerName);
        data.put("loanNumber", savedLoan.getLoanNumber());

        notifyAllAdmins(
                "New Loan Created",
                "Admin created a new loan for customer " + customerName + ": " + savedLoan.getLoanNumber(),
                "LOAN_CREATED",
                savedLoan.getId(),
                data
        );

        return savedLoan;
    }

    @Transactional
    public CustomerLoan createLoanFromCustomerRequest(String customerId, com.ecommerce.dto.CustomerLoanRequestDTO request) {
        List<String> goldItemIds = new java.util.ArrayList<>();

        if (request.getGoldItems() != null) {
            for (com.ecommerce.dto.GoldItemDTO itemDTO : request.getGoldItems()) {
                GoldItem item = new GoldItem();
                item.setCustomerId(customerId);
                item.setItemType(itemDTO.getItemType());
                item.setWeightInGrams(itemDTO.getWeightInGrams());
                item.setPurity(itemDTO.getPurity());
                item.setDescription(itemDTO.getDescription());
                item.setEstimatedValue(itemDTO.getEstimatedValue());
                item.setSerialNumber(itemDTO.getSerialNumber());
                item.setImageUrl(itemDTO.getImageUrl());
                item.setBillAttachments(itemDTO.getBillAttachments());
                item.setStatus("PENDING");
                item.setCreatedAt(LocalDateTime.now());
                item.setUpdatedAt(LocalDateTime.now());

                GoldItem savedItem = goldItemRepository.save(item);
                goldItemIds.add(savedItem.getId());
            }
        }

        CustomerLoan loan = new CustomerLoan();
        loan.setCustomerId(customerId);
        loan.setLoanNumber(generateLoanNumber());
        loan.setPrincipalAmount(request.getPrincipalAmount());
        loan.setInterestRate(0.0);
        loan.setInterestType("COMPOUND");
        loan.setTenureMonths(request.getTenureMonths());
        loan.setStartDate(LocalDateTime.now());
        loan.setMaturityDate(LocalDateTime.now().plusMonths(request.getTenureMonths()));
        loan.setStatus("PENDING_APPROVAL");
        loan.setGoldItemIds(goldItemIds);
        loan.setTotalInterestReceivable(0.0);
        loan.setInterestPaidSoFar(0.0);
        loan.setAmountPaidSoFar(0.0);
        loan.setOutstandingAmount(request.getPrincipalAmount());
        loan.setLastPaymentDate(null);
        loan.setSmsNotifications(true);
        loan.setCreatedAt(LocalDateTime.now());
        loan.setUpdatedAt(LocalDateTime.now());

        CustomerLoan savedLoan = customerLoanRepository.save(loan);

        for (String itemId : goldItemIds) {
            goldItemRepository.findById(itemId).ifPresent(item -> {
                item.setCustomerLoanId(savedLoan.getId());
                goldItemRepository.save(item);
            });
        }

        String customerName = getCustomerName(customerId);

        Map<String, Object> customerData = new HashMap<>();
        customerData.put("loanNumber", savedLoan.getLoanNumber());

        notificationService.createNotification(
                customerId,
                "Loan Request Submitted",
                "Your loan request " + savedLoan.getLoanNumber() + " has been submitted securely. Pending administrator review.",
                "LOAN_REQUESTED",
                savedLoan.getId(),
                customerData
        );

        Map<String, Object> adminData = new HashMap<>();
        adminData.put("customerName", customerName);
        adminData.put("loanNumber", savedLoan.getLoanNumber());

        notifyAllAdmins(
                "New Loan Request",
                "Customer " + customerName + " has requested a new loan: " + savedLoan.getLoanNumber(),
                "LOAN_REQUEST",
                savedLoan.getId(),
                adminData
        );

        return savedLoan;
    }

    @Transactional
    public CustomerLoan approveLoan(String loanId, Double principalAmount, Double interestRate) {
        CustomerLoan loan = getLoanById(loanId);
        if (!"PENDING_APPROVAL".equals(loan.getStatus())) {
            throw new RuntimeException("Loan is not in pending status");
        }

        if (principalAmount != null) {
            loan.setPrincipalAmount(principalAmount);
            loan.setOutstandingAmount(principalAmount);
        }
        if (interestRate != null) {
            loan.setInterestRate(interestRate);
        }

        loan.setStatus("ACTIVE");
        LocalDateTime now = LocalDateTime.now();
        loan.setStartDate(now);
        loan.setMaturityDate(now.plusMonths(loan.getTenureMonths()));

        double totalInterest = calculateCompoundInterest(
                loan.getPrincipalAmount(),
                loan.getInterestRate(),
                loan.getTenureMonths()
        );
        loan.setTotalInterestReceivable(totalInterest);
        loan.setInterestType("COMPOUND");
        loan.setLastPaymentDate(now);

        if (loan.getGoldItemIds() != null) {
            for (String itemId : loan.getGoldItemIds()) {
                goldItemRepository.findById(itemId).ifPresent(item -> {
                    if ("PENDING".equals(item.getStatus())) {
                        item.setStatus("PLEDGED");
                        item.setUpdatedAt(now);
                        goldItemRepository.save(item);
                    }
                });
            }
        }

        CustomerLoan updatedLoan = customerLoanRepository.save(loan);
        String customerName = getCustomerName(updatedLoan.getCustomerId());

        Map<String, Object> customerData = new HashMap<>();
        customerData.put("loanNumber", updatedLoan.getLoanNumber());

        notificationService.createNotification(
                updatedLoan.getCustomerId(),
                "Loan Approved",
                "Your loan request " + updatedLoan.getLoanNumber() + " has been approved and is now ACTIVE.",
                "LOAN_APPROVED",
                updatedLoan.getId(),
                customerData
        );

        Map<String, Object> adminData = new HashMap<>();
        adminData.put("customerName", customerName);
        adminData.put("loanNumber", updatedLoan.getLoanNumber());

        notifyAllAdmins(
                "Loan Approved",
                "Loan " + updatedLoan.getLoanNumber() + " for customer " + customerName + " has been approved.",
                "LOAN_APPROVED",
                updatedLoan.getId(),
                adminData
        );

        return updatedLoan;
    }

    @Transactional
    public CustomerLoan rejectLoan(String loanId, String reason) {
        CustomerLoan loan = getLoanById(loanId);
        if (!"PENDING_APPROVAL".equals(loan.getStatus())) {
            throw new RuntimeException("Loan is not in pending status");
        }

        loan.setStatus("REJECTED");
        loan.setRejectionReason(reason);
        CustomerLoan updatedLoan = customerLoanRepository.save(loan);

        releaseGoldItems(updatedLoan.getGoldItemIds());

        String customerName = getCustomerName(updatedLoan.getCustomerId());

        Map<String, Object> customerData = new HashMap<>();
        customerData.put("loanNumber", updatedLoan.getLoanNumber());
        customerData.put("reason", reason);

        notificationService.createNotification(
                updatedLoan.getCustomerId(),
                "Loan Rejected",
                "Your loan request " + updatedLoan.getLoanNumber() + " was rejected. Reason: " + reason,
                "LOAN_REJECTED",
                updatedLoan.getId(),
                customerData
        );

        Map<String, Object> adminData = new HashMap<>();
        adminData.put("customerName", customerName);
        adminData.put("loanNumber", updatedLoan.getLoanNumber());
        adminData.put("reason", reason);

        notifyAllAdmins(
                "Loan Rejected",
                "Loan " + updatedLoan.getLoanNumber() + " for customer " + customerName + " was rejected. Reason: " + reason,
                "LOAN_REJECTED",
                updatedLoan.getId(),
                adminData
        );

        return updatedLoan;
    }

    public List<CustomerLoan> getPendingApprovalLoans() {
        return customerLoanRepository.findByStatus("PENDING_APPROVAL");
    }

    @Transactional
    public CustomerLoan processRepayment(String loanId, Double amount) {
        CustomerLoan loan = customerLoanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        if (!"ACTIVE".equals(loan.getStatus())) {
            throw new RuntimeException("Loan is not active");
        }
        if (amount == null || amount <= 0) {
            throw new RuntimeException("Repayment amount must be positive");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastPaymentDate = loan.getLastPaymentDate();
        if (lastPaymentDate == null) {
            lastPaymentDate = loan.getStartDate();
            loan.setLastPaymentDate(lastPaymentDate);
        }

        long daysBetween = ChronoUnit.DAYS.between(lastPaymentDate, now);
        if (daysBetween < 0) {
            throw new RuntimeException("Last payment date is in the future");
        }
        double dailyRate = loan.getInterestRate() / 100 / 365.0;

        double accruedInterest = loan.getOutstandingAmount() * dailyRate * daysBetween;

        if (amount < accruedInterest - 1e-9) {
            throw new RuntimeException(String.format(
                    "Payment amount (%.2f) is less than accrued interest since last payment (%.2f). " +
                            "Please pay at least the accrued interest.", amount, accruedInterest));
        }

        double interestPortion = accruedInterest;
        double principalPortion = amount - accruedInterest;

        loan.setInterestPaidSoFar(loan.getInterestPaidSoFar() + interestPortion);
        loan.setAmountPaidSoFar(loan.getAmountPaidSoFar() + amount);
        loan.setOutstandingAmount(loan.getOutstandingAmount() - principalPortion);
        loan.setLastPaymentDate(now);

        if (loan.getOutstandingAmount() <= 1e-9) {
            loan.setStatus("CLOSED");
            loan.setOutstandingAmount(0.0);
            releaseGoldItems(loan.getGoldItemIds());
        }

        CustomerLoan updatedLoan = customerLoanRepository.save(loan);

        sendPaymentSms(updatedLoan, amount, interestPortion, principalPortion);
        return updatedLoan;
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

    private String generateLoanNumber() {
        return "CL-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) +
                "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private void releaseGoldItems(List<String> goldItemIds) {
        if (goldItemIds == null) return;
        for (String itemId : goldItemIds) {
            goldItemRepository.findById(itemId).ifPresent(item -> {
                item.setStatus("AVAILABLE");
                item.setCustomerLoanId(null);
                goldItemRepository.save(item);
            });
        }
    }
    public List<CustomerLoan> searchLoans(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return List.of();
        }
        return customerLoanRepository.searchLoans(searchTerm);
    }

    public CustomerLoan getLoanByCustomerSerialNumber(String serialNumber) {
        return customerLoanRepository.findByCustomerSerialNumber(serialNumber)
                .orElseThrow(() -> new RuntimeException("Loan not found with serial number: " + serialNumber));
    }

    private void sendLoanCreationSms(CustomerLoan loan) {
        String phoneNumber = "98XXXXXXXX";
        String message = String.format(
                "Your gold loan of NPR %.2f has been approved. Loan Number: %s. Maturity Date: %s",
                loan.getPrincipalAmount(), loan.getLoanNumber(),
                loan.getMaturityDate().toLocalDate().toString()
        );
        smsService.sendSms(phoneNumber, message, "LOAN_CREATION", loan.getId());
    }

    private void sendPaymentSms(CustomerLoan loan, Double amount, Double interestPortion, Double principalPortion) {
        String phoneNumber = "98XXXXXXXX";
        String message = String.format(
                "Payment of NPR %.2f received for loan %s. Interest: %.2f, Principal: %.2f. Outstanding: NPR %.2f",
                amount, loan.getLoanNumber(), interestPortion, principalPortion, loan.getOutstandingAmount()
        );
        smsService.sendSms(phoneNumber, message, "PAYMENT_RECEIVED", loan.getId());
    }
}