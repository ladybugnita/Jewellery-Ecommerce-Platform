package com.ecommerce.service;

import com.ecommerce.dto.BankLoanRequest;
import com.ecommerce.model.BankLoan;
import com.ecommerce.repository.BankLoanRepository;
import com.ecommerce.repository.GoldItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BankLoanService {
    private final BankLoanRepository bankLoanRepository;
    private final GoldItemRepository goldItemRepository;

    @Transactional
    public BankLoan createBankLoan(BankLoanRequest request) {
        BankLoan loan = new BankLoan();
        loan.setBankName(request.getBankName());
        loan.setLoanNumber(generateBankLoanNumber());
        loan.setPrincipalAmount(request.getPrincipalAmount());
        loan.setInterestRate(request.getInterestRate());
        loan.setTenureMonths(request.getTenureMonths());
        loan.setStartDate(LocalDateTime.now());
        loan.setMaturityDate(LocalDateTime.now().plusMonths(request.getTenureMonths()));
        loan.setStatus("ACTIVE");

        double totalInterest = request.getPrincipalAmount() * (request.getInterestRate() / 100) * request.getTenureMonths();
        loan.setTotalInterestPayable(totalInterest);
        loan.setInterestPaidSoFar(0.0);
        loan.setAmountPaidSoFar(0.0);
        loan.setOutstandingAmount(request.getPrincipalAmount());
        
        if(request.getGoldItemIds() != null && !request.getGoldItemIds().isEmpty()) {
            loan.setPledgedGoldItemIds(request.getGoldItemIds());
            
            for (String itemId : request.getGoldItemIds()) {
                goldItemRepository.findById(itemId).ifPresent(item -> {
                    item.setStatus("PLEDGED_TO_BANK");
                    goldItemRepository.save(item);
                });
            }
        }
        return bankLoanRepository.save(loan);
    }
    @Transactional
    public BankLoan processBankPayment(String loanId, Double amount) {
        BankLoan loan = bankLoanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Bank loan not found"));
        
        if(!"ACTIVE".equals(loan.getStatus())) {
            throw new RuntimeException("Loan is not active");
        }
        loan.setAmountPaidSoFar(loan.getAmountPaidSoFar() + amount);
        loan.setOutstandingAmount(loan.getPrincipalAmount() - loan.getAmountPaidSoFar());
        
        double interestPaid = amount * (loan.getInterestRate() / 100);
        loan.setInterestPaidSoFar(loan.getInterestPaidSoFar() + interestPaid);
        loan.setLastPaymentDate(LocalDateTime.now());
        
        if (loan.getOutstandingAmount() <= 0) {
            loan.setStatus("CLOSED");
        }
        return bankLoanRepository.save(loan);
    }
    public List<BankLoan> getAllActiveBankLoans() {
        return bankLoanRepository.findByStatus("ACTIVE");
    }
    public BankLoan getBankLoanById(String id) {
        return bankLoanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bank loan not found"));
    }
    public Double getTotalPayableInterest(){
        List<BankLoan> activeLoans = bankLoanRepository.findByStatus("ACTIVE");
        return activeLoans.stream()
                .mapToDouble(BankLoan::getTotalInterestPayable)
                .sum();
    }
    public Double getTotalBankLoans() {
        List<BankLoan> activeLoans = bankLoanRepository.findByStatus("ACTIVE");
        return activeLoans.stream()
                .mapToDouble(BankLoan::getPrincipalAmount)
                .sum();
    }
    public Double getTotalOutstandingAmount() {
        List<BankLoan> activeLoans = bankLoanRepository.findByStatus("ACTIVE");
        return activeLoans.stream()
                .mapToDouble(BankLoan::getOutstandingAmount)
                .sum();
    }

    private String generateBankLoanNumber() {
        return "BL-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) +
                "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
