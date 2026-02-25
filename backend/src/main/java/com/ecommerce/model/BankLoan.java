package com.ecommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "bank_loans")
public class BankLoan {
    @Id
    private String id;
    private String bankName;
    private String loanNumber;
    private Double principalAmount;
    private Double interestRate;
    private Integer tenureMonths;
    private LocalDateTime startDate;
    private LocalDateTime maturityDate;
    private String status;
    private List<String> pledgedGoldItemIds;
    private Double totalInterestPayable;
    private Double interestPaidSoFar;
    private Double amountPaidSoFar;
    private Double outstandingAmount;
    private LocalDateTime lastPaymentDate;
}
