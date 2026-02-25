package com.ecommerce.service;

import com.ecommerce.dto.CustomerLoanRequest;
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
        loan.setPrincipalAmount(request.getPrincipalAmount());
        loan.setInterestRate(request.getInterestRate());
        loan.setTenureMonths(request.getTenureMonths());
        loan.setStartDate(LocalDateTime.now());
        loan.setMaturityDate(LocalDateTime.now().plusMonths(request.getTenureMonths()));
        loan.setStatus("ACTIVE");
        loan.setGoldItemIds(request.getGoldItemIds());

        double totalInterest = request.getPrincipalAmount() * (request.getInterestRate() / 100) * request.getTenureMonths();
        loan.setTotalInterestReceivable(totalInterest);
        loan.setInterestPaidSoFar(0.0);
        loan.setAmountPaidSoFar(0.0);
        loan.setOutstandingAmount(request.getPrincipalAmount());
        loan.setLastPaymentDate(LocalDateTime.now());
        loan.setSmsNotifications(true);

        for(GoldItem item : goldItems) {
            item.setStatus("PLEDGED");
            goldItemRepository.save(item);
        }

        CustomerLoan savedLoan = customerLoanRepository.save(loan);

        sendLoanCreationSms(savedLoan);
        return savedLoan;
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
