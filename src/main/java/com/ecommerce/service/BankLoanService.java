package com.ecommerce.service;

import com.ecommerce.dto.BankLoanRequest;
import com.ecommerce.model.BankLoan;
import com.ecommerce.model.CustomerLoan;
import com.ecommerce.model.GoldItem;
import com.ecommerce.repository.BankLoanRepository;
import com.ecommerce.repository.CustomerLoanRepository;
import com.ecommerce.repository.GoldItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BankLoanService {

    private final BankLoanRepository bankLoanRepository;
    private final GoldItemRepository goldItemRepository;
    private final CustomerLoanRepository customerLoanRepository;

    @Transactional
    public BankLoan createBankLoan(BankLoanRequest request) {
        if (request.getBankSerialNumber() != null) {
            Optional<BankLoan> existingLoan = bankLoanRepository
                    .findByBankSerialNumber(request.getBankSerialNumber());
            if (existingLoan.isPresent()) {
                throw new RuntimeException("Bank serial number already exists: " + request.getBankSerialNumber());
            }
        } else {
            throw new RuntimeException("Bank serial number is required");
        }

        BankLoan loan = new BankLoan();
        loan.setBankName(request.getBankName());
        loan.setBankSerialNumber(request.getBankSerialNumber());
        loan.setLoanNumber(generateBankLoanNumber());
        loan.setPrincipalAmount(request.getPrincipalAmount());
        loan.setInterestRate(request.getInterestRate());
        loan.setTenureMonths(request.getTenureMonths());
        loan.setStartDate(LocalDateTime.now());
        loan.setMaturityDate(LocalDateTime.now().plusMonths(request.getTenureMonths()));
        loan.setStatus("ACTIVE");
        loan.setBankGoldImages(request.getBankGoldImages());
        loan.setIsBulkLoan(true);
        loan.setCreatedAt(LocalDateTime.now());
        loan.setUpdatedAt(LocalDateTime.now());

        double totalInterest = request.getPrincipalAmount() * (request.getInterestRate() / 100) * request.getTenureMonths();
        loan.setTotalInterestPayable(totalInterest);
        loan.setInterestPaidSoFar(0.0);
        loan.setAmountPaidSoFar(0.0);
        loan.setOutstandingAmount(request.getPrincipalAmount());

        if (request.getGoldItemIds() != null && !request.getGoldItemIds().isEmpty()) {
            List<GoldItem> goldItems = goldItemRepository.findAllById(request.getGoldItemIds());

            Set<String> customerLoanIds = new HashSet<>();
            Set<String> customerSerialNumbers = new HashSet<>();
            List<Map<String, Object>> individualCalculations = new ArrayList<>();

            double totalGoldValue = goldItems.stream()
                    .mapToDouble(item -> item.getEstimatedValue() != null ? item.getEstimatedValue() : 0)
                    .sum();

            for (GoldItem item : goldItems) {
                if (!"PLEDGED".equals(item.getStatus())) {
                    throw new RuntimeException("Gold item " + item.getId() + " is not available for bank pledge");
                }

                if (item.getCustomerLoanId() != null) {
                    customerLoanIds.add(item.getCustomerLoanId());

                    customerLoanRepository.findById(item.getCustomerLoanId())
                            .ifPresent(customerLoan -> {
                                customerSerialNumbers.add(customerLoan.getCustomerSerialNumber());
                            });
                }

                Map<String, Object> individualCalc = new HashMap<>();
                individualCalc.put("goldItemId", item.getId());
                individualCalc.put("itemType", item.getItemType());
                individualCalc.put("weightInGrams", item.getWeightInGrams());
                individualCalc.put("purity", item.getPurity());
                individualCalc.put("estimatedValue", item.getEstimatedValue());

                double proportion = totalGoldValue > 0 ?
                        (item.getEstimatedValue() / totalGoldValue) : 0;

                double individualPrincipal = request.getPrincipalAmount() * proportion;
                double individualInterest = individualPrincipal * (request.getInterestRate() / 100) * request.getTenureMonths();

                individualCalc.put("proportion", proportion);
                individualCalc.put("allocatedPrincipal", individualPrincipal);
                individualCalc.put("allocatedInterest", individualInterest);
                individualCalc.put("customerLoanId", item.getCustomerLoanId());
                individualCalc.put("customerSerialNumber", getCustomerSerialNumber(item.getCustomerLoanId()));

                individualCalculations.add(individualCalc);
            }

            List<Map<String, Object>> goldItemsDetails = goldItems.stream()
                    .map(item -> {
                        Map<String, Object> details = new HashMap<>();
                        details.put("id", item.getId());
                        details.put("itemType", item.getItemType());
                        details.put("weightInGrams", item.getWeightInGrams());
                        details.put("purity", item.getPurity());
                        details.put("estimatedValue", item.getEstimatedValue());
                        details.put("serialNumber", item.getSerialNumber());
                        details.put("customerId", item.getCustomerId());
                        details.put("customerLoanId", item.getCustomerLoanId());
                        details.put("imageUrl", item.getImageUrl());
                        details.put("billAttachments", item.getBillAttachments());
                        return details;
                    })
                    .collect(Collectors.toList());

            loan.setPledgedGoldItemIds(request.getGoldItemIds());
            loan.setGoldItemsDetails(goldItemsDetails);
            loan.setCustomerLoanIds(new ArrayList<>(customerLoanIds));
            loan.setCustomerSerialNumbers(new ArrayList<>(customerSerialNumbers));
            loan.setIndividualGoldCalculations(individualCalculations);

            for (GoldItem item : goldItems) {
                item.setStatus("PLEDGED_TO_BANK");
                item.setBankLoanId(loan.getId());
                item.setUpdatedAt(LocalDateTime.now());
                goldItemRepository.save(item);
            }
        }

        return bankLoanRepository.save(loan);
    }

    @Transactional
    public BankLoan processBankPayment(String loanId, Double amount) {
        BankLoan loan = bankLoanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Bank loan not found"));

        if (!"ACTIVE".equals(loan.getStatus())) {
            throw new RuntimeException("Loan is not active");
        }

        loan.setAmountPaidSoFar(loan.getAmountPaidSoFar() + amount);
        loan.setOutstandingAmount(loan.getPrincipalAmount() - loan.getAmountPaidSoFar());
        loan.setUpdatedAt(LocalDateTime.now());

        double interestPaid = amount * (loan.getInterestRate() / 100);
        loan.setInterestPaidSoFar(loan.getInterestPaidSoFar() + interestPaid);
        loan.setLastPaymentDate(LocalDateTime.now());

        if (loan.getIndividualGoldCalculations() != null) {
            double paymentProportion = amount / loan.getPrincipalAmount();
            for (Map<String, Object> goldCalc : loan.getIndividualGoldCalculations()) {
                double allocatedPrincipal = (double) goldCalc.get("allocatedPrincipal");
                double paidPrincipal = allocatedPrincipal * paymentProportion;
                goldCalc.put("paidPrincipal", paidPrincipal);
                goldCalc.put("remainingPrincipal", allocatedPrincipal - paidPrincipal);
            }
        }

        if (loan.getOutstandingAmount() <= 0) {
            loan.setStatus("CLOSED");
            if (loan.getPledgedGoldItemIds() != null) {
                for (String itemId : loan.getPledgedGoldItemIds()) {
                    goldItemRepository.findById(itemId).ifPresent(item -> {
                        item.setStatus("PLEDGED");
                        item.setBankLoanId(null);
                        item.setUpdatedAt(LocalDateTime.now());
                        goldItemRepository.save(item);
                    });
                }
            }
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


    public List<BankLoan> searchBankLoansBySerialNumber(String serialNumber) {
        return bankLoanRepository.searchByBankSerialNumber(serialNumber);
    }

    public List<BankLoan> searchBankLoans(String searchTerm) {
        return bankLoanRepository.searchLoans(searchTerm);
    }

    public List<BankLoan> getBankLoansByCustomerLoanId(String customerLoanId) {
        return bankLoanRepository.findByCustomerLoanId(customerLoanId);
    }

    public Map<String, Object> getBankLoanWithIndividualDetails(String bankLoanId) {
        BankLoan loan = getBankLoanById(bankLoanId);

        Map<String, Object> detailedLoan = new HashMap<>();
        detailedLoan.put("loan", loan);
        detailedLoan.put("individualGoldCalculations", loan.getIndividualGoldCalculations());

        if (loan.getPledgedGoldItemIds() != null) {
            List<GoldItem> goldItems = goldItemRepository.findAllById(loan.getPledgedGoldItemIds());
            detailedLoan.put("goldItems", goldItems);
        }

        return detailedLoan;
    }

    public List<Map<String, Object>> getAvailableGoldItemsForBank() {
        List<GoldItem> availableItems = goldItemRepository.findByStatus("PLEDGED");

        return availableItems.stream()
                .map(item -> {
                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("id", item.getId());
                    itemMap.put("itemType", item.getItemType());
                    itemMap.put("weightInGrams", item.getWeightInGrams());
                    itemMap.put("purity", item.getPurity());
                    itemMap.put("estimatedValue", item.getEstimatedValue());
                    itemMap.put("serialNumber", item.getSerialNumber());
                    itemMap.put("customerId", item.getCustomerId());
                    itemMap.put("customerLoanId", item.getCustomerLoanId());

                    if (item.getCustomerLoanId() != null) {
                        customerLoanRepository.findById(item.getCustomerLoanId())
                                .ifPresent(loan -> {
                                    itemMap.put("customerSerialNumber", loan.getCustomerSerialNumber());
                                    itemMap.put("customerLoanNumber", loan.getLoanNumber());
                                });
                    }

                    return itemMap;
                })
                .collect(Collectors.toList());
    }

    private String getCustomerSerialNumber(String customerLoanId) {
        if (customerLoanId == null) return null;
        return customerLoanRepository.findById(customerLoanId)
                .map(CustomerLoan::getCustomerSerialNumber)
                .orElse(null);
    }

    private String generateBankLoanNumber() {
        return "BL-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) +
                "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    public Double getTotalPayableInterest() {
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

    public List<BankLoan> searchLoans(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return List.of();
        }
        return bankLoanRepository.searchLoans(searchTerm);
    }

    public BankLoan getBankLoanBySerialNumber(String serialNumber) {
        return bankLoanRepository.findByBankSerialNumber(serialNumber)
                .orElseThrow(() -> new RuntimeException("Bank loan not found with serial: " + serialNumber));
    }
}