package com.ecommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "bank_loans")
public class BankLoan {
    @Id
    private String id;
    private String bankName;
    private String loanNumber;
    private String bankSerialNumber;

    private Double principalAmount;
    private Double interestRate;
    private Integer tenureMonths;
    private LocalDateTime startDate;
    private LocalDateTime maturityDate;
    private String status;

    private List<String> pledgedGoldItemIds;

    private List<Map<String, Object>> goldItemsDetails;

    private List<String> customerLoanIds;
    private List<String> customerSerialNumbers;

    private List<String> bankGoldImages;

    private Double totalInterestPayable;
    private Double interestPaidSoFar;
    private Double amountPaidSoFar;
    private Double outstandingAmount;
    private LocalDateTime lastPaymentDate;

    private List<Map<String, Object>> individualGoldCalculations;

    private Boolean isBulkLoan = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}