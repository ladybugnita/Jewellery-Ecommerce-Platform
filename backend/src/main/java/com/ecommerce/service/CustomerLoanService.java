package com.ecommerce.service;

import com.ecommerce.dto.CustomerLoanRequest;
import com.ecommerce.dto.CustomerLoanRequestDTO;
import com.ecommerce.model.CustomerLoan;
import com.ecommerce.model.GoldItem;
import com.ecommerce.repository.CustomerLoanRepository;
import com.ecommerce.repository.GoldItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerLoanService {
    private final CustomerLoanRepository customerLoanRepository;
    private final GoldItemRepository goldItemRepository;
    private final SmsService smsService;
    private final NotificationService notificationService;

    @Transactional
    public CustomerLoan createLoan(CustomerLoanRequest request) {
        List<GoldItem> goldItems = goldItemRepository.findAllById(request.getGoldItemIds());

        for (GoldItem item : goldItems) {
            if (!item.getCustomerId().equals(request.getCustomerId())) {
                throw new RuntimeException("Gold item " + item.getId() + "does not belong to this customer");
            }
            if(!"AVAILABLE".equals(item.getStatus())) {
                throw new RuntimeException("Gold item " + item.getId() + "is not available");
            }
        }
        CustomerLoan loan = new CustomerLoan();
        loan.setCustomerId(request.getCustomerId());
        loan.setLoanNumber(generateLoanNumber());
        loan.setCustomerSerialNumber(request.isAutoGenerateSerialNumber() ? 
            loan.getLoanNumber() : request.getCustomerSerialNumber());
        loan.setPrincipalAmount(request.getPrincipalAmount());
        loan.setInterestRate(request.getInterestRate());
        loan.setTenureMonths(request.getTenureMonths());
        loan.setStartDate(LocalDateTime.now());
        loan.setMaturityDate(LocalDateTime.now().plusMonths(request.getTenureMonths()));
        loan.setStatus("PENDING_APPROVAL");
        loan.setGoldItemIds(request.getGoldItemIds());

        double totalInterest = request.getPrincipalAmount() * (request.getInterestRate() / 100) * request.getTenureMonths();
        loan.setTotalInterestReceivable(totalInterest);
        loan.setInterestPaidSoFar(0.0);
        loan.setAmountPaidSoFar(0.0);
        loan.setOutstandingAmount(request.getPrincipalAmount());
        loan.setLastPaymentDate(LocalDateTime.now());
        loan.setSmsNotifications(true);

        CustomerLoan savedLoan = customerLoanRepository.save(loan);

        for(GoldItem item : goldItems) {
            item.setStatus("AVAILABLE");
            item.setCustomerLoanId(savedLoan.getId());
            item.setLoanNumber(savedLoan.getLoanNumber());
            item.setCustomerSerialNumber(savedLoan.getCustomerSerialNumber());
            goldItemRepository.save(item);
        }

        // Notify admins about new loan request
        notificationService.createNotification(
                "ADMIN", // System/Admin notification
                "New Loan Request",
                "A new loan request " + savedLoan.getLoanNumber() + " has been submitted and is pending approval.",
                "NEW_LOAN_REQUEST",
                savedLoan.getId()
        );

        return savedLoan;
    }

    @Transactional
    public CustomerLoan createLoanFromCustomerRequest(String customerId, CustomerLoanRequestDTO request) {
        List<String> goldItemIds = new java.util.ArrayList<>();

        List<GoldItem> createdItems = new java.util.ArrayList<>();
        // 1. Create and save gold items
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
                item.setStatus("AVAILABLE"); // Keep as available until approved
                item.setCreatedAt(LocalDateTime.now());
                item.setUpdatedAt(LocalDateTime.now());

                GoldItem savedItem = goldItemRepository.save(item);
                createdItems.add(savedItem);
                goldItemIds.add(savedItem.getId());
            }
        }

        // 2. Create the loan request
        CustomerLoan loan = new CustomerLoan();
        loan.setCustomerId(customerId);
        loan.setLoanNumber(generateLoanNumber());
        loan.setCustomerSerialNumber((request.getAutoGenerateSerialNumber() == null || request.getAutoGenerateSerialNumber()) ? 
            loan.getLoanNumber() : request.getCustomerSerialNumber());
        loan.setPrincipalAmount(request.getPrincipalAmount());

        // Default interest rate - to be finalized by admin
        loan.setInterestRate(0.0);
        loan.setInterestType("COMPOUND");
        loan.setTenureMonths(request.getTenureMonths());
        loan.setStartDate(LocalDateTime.now());
        loan.setMaturityDate(LocalDateTime.now().plusMonths(request.getTenureMonths()));
        loan.setStatus("PENDING_APPROVAL");
        loan.setGoldItemIds(goldItemIds);

        // Initialize other fields. Interest will be calculated properly by admin during approval
        loan.setTotalInterestReceivable(0.0);
        loan.setInterestPaidSoFar(0.0);
        loan.setAmountPaidSoFar(0.0);
        loan.setOutstandingAmount(request.getPrincipalAmount());
        loan.setLastPaymentDate(LocalDateTime.now());
        loan.setSmsNotifications(true);
        loan.setCreatedAt(LocalDateTime.now());
        loan.setUpdatedAt(LocalDateTime.now());

        CustomerLoan savedLoan = customerLoanRepository.save(loan);

        // 3. Update gold items with the loan ID and Number
        for (GoldItem item : createdItems) {
            item.setCustomerLoanId(savedLoan.getId());
            item.setLoanNumber(savedLoan.getLoanNumber());
            item.setCustomerSerialNumber(savedLoan.getCustomerSerialNumber());
            item.setStatus("AVAILABLE"); // Ensure it remains AVAILABLE upon request
            item.setUpdatedAt(LocalDateTime.now());
            goldItemRepository.save(item);
        }

        // 4. Notifications
        // Notify Customer
        notificationService.createNotification(
                customerId,
                "Loan Request Submitted",
                "Your loan request " + savedLoan.getLoanNumber() + " has been submitted securely. Pending administrator review.",
                "LOAN_REQUESTED",
                savedLoan.getId()
        );

        // Notify Admins
        notificationService.createNotification(
                "ADMIN",
                "New Loan Request",
                "Customer " + customerId + " has requested a new loan: " + savedLoan.getLoanNumber(),
                "LOAN_REQUEST",
                savedLoan.getId()
        );

        return savedLoan;
    }

    @Transactional
    public CustomerLoan approveLoan(String loanId, Double principalAmount, Double interestRate) {
        CustomerLoan loan = getLoanById(loanId);
        if (!"PENDING_APPROVAL".equals(loan.getStatus())) {
            throw new RuntimeException("Loan is not in pending status");
        }

        // Update loan details if provided
        if (principalAmount != null) {
            loan.setPrincipalAmount(principalAmount);
            loan.setOutstandingAmount(principalAmount);
        }
        if (interestRate != null) {
            loan.setInterestRate(interestRate);
        }

        loan.setStatus("ACTIVE");
        // Start date becomes today when approved
        loan.setStartDate(LocalDateTime.now());
        loan.setMaturityDate(LocalDateTime.now().plusMonths(loan.getTenureMonths()));

        // Recalculate total interest for compound interest
        // For simplicity, we'll store a preliminary calculation or update it during repayments
        // The front-end breakdown uses the current rate/principal
        double totalInterest = loan.getPrincipalAmount() * (loan.getInterestRate() / 100) * (loan.getTenureMonths() / 12.0);
        loan.setTotalInterestReceivable(totalInterest);

        CustomerLoan updatedLoan = customerLoanRepository.save(loan);

        // Generate Dashboard Notification for Customer
        notificationService.createNotification(
                updatedLoan.getCustomerId(),
                "Loan Approved",
                "Your loan request " + updatedLoan.getLoanNumber() + " has been approved and is now ACTIVE.",
                "LOAN_APPROVED",
                updatedLoan.getId()
        );

        // Set gold items to PLEDGED
        if (updatedLoan.getGoldItemIds() != null) {
            for (String itemId : updatedLoan.getGoldItemIds()) {
                goldItemRepository.findById(itemId).ifPresent(item -> {
                    item.setStatus("PLEDGED");
                    goldItemRepository.save(item);
                });
            }
        }

        // Generate Dashboard Notification for Admin
        notificationService.createNotification(
                "ADMIN",
                "Loan Approved",
                "Loan " + updatedLoan.getLoanNumber() + " has been approved for customer " + updatedLoan.getCustomerId(),
                "LOAN_APPROVED",
                updatedLoan.getId()
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

        // Release gold items since it was rejected
        releaseGoldItems(updatedLoan.getGoldItemIds());

        // Generate Dashboard Notification for Customer
        notificationService.createNotification(
                updatedLoan.getCustomerId(),
                "Loan Rejected",
                "Your loan request " + updatedLoan.getLoanNumber() + " was rejected. Reason: " + reason,
                "LOAN_REJECTED",
                updatedLoan.getId()
        );

        // Generate Dashboard Notification for Admin
        notificationService.createNotification(
                "ADMIN",
                "Loan Rejected",
                "Loan " + updatedLoan.getLoanNumber() + " for customer " + updatedLoan.getCustomerId() + " was rejected. Reason: " + reason,
                "LOAN_REJECTED",
                updatedLoan.getId()
        );

        return updatedLoan;
    }

    public List<CustomerLoan> getPendingApprovalLoans() {
        return customerLoanRepository.findByStatus("PENDING_APPROVAL");
    }

    @Transactional
    public CustomerLoan processRepayment(String loanId, Double amount) {
        CustomerLoan loan = customerLoanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("loan not found"));

        if(!"ACTIVE".equals(loan.getStatus())) {
            throw new RuntimeException("Loan is not active");
        }
        loan.setAmountPaidSoFar(loan.getAmountPaidSoFar() + amount);
        loan.setOutstandingAmount(loan.getPrincipalAmount() - loan.getAmountPaidSoFar());
        loan.setLastPaymentDate(LocalDateTime.now());

        double interestPaid = amount * (loan.getInterestRate() / 100);
        loan.setInterestPaidSoFar(loan.getInterestPaidSoFar() + interestPaid);

        if(loan.getOutstandingAmount() <= 0){
            loan.setStatus("CLOSED");
            releaseGoldItems(loan.getGoldItemIds());
        }
        CustomerLoan updatedLoan = customerLoanRepository.save(loan);

        sendPaymentSms(updatedLoan, amount);
        return updatedLoan;
    }
    public List<CustomerLoan> getAllActiveLoans() {
        return customerLoanRepository.findByStatus("ACTIVE");
    }
    public List<CustomerLoan> getCustomerLoans(String customerId){
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
                "-" + UUID.randomUUID().toString().substring(0,8).toUpperCase();
    }
    private void releaseGoldItems(List<String> goldItemIds){
        for(String itemId: goldItemIds) {
            goldItemRepository.findById(itemId).ifPresent(item -> {
                item.setStatus("AVAILABLE");
                goldItemRepository.save(item);
            });
        }
    }
    private void sendLoanCreationSms(CustomerLoan loan) {
        String phoneNumber = "98XXXXXXXX";
        String message = String.format(
                "Your gold loan of NPR %.2f has been approved. Loan Number: %s.Maturity Date: %s",
                loan.getPrincipalAmount(), loan.getLoanNumber(),
                loan.getMaturityDate().toLocalDate().toString()
        );
        smsService.sendSms(phoneNumber, message, "LOAN CREATION", loan.getId());
    }
    private void sendPaymentSms(CustomerLoan loan, Double amount){
        String phoneNumber = "98XXXXXXXX";
        String message = String.format(
                "Payment of NPR %.2f received for loan %s. Outstanding: NPR %.2f",
                amount, loan.getLoanNumber(), loan.getOutstandingAmount()
        );
        smsService.sendSms(phoneNumber, message, "PAYMENT_RECEIVED", loan.getId());
    }
}
