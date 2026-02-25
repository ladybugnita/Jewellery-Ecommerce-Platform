package com.ecommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "customer_loans")
public class CustomerLoan {
    @Id
    private String id;
    private String customerId;
    private String loanNumber;
    private Double principalAmount;
    private Double interestRate;
    private Integer tenureMonths;
    private LocalDateTime startDate;
    private LocalDateTime maturityDate;
    private String status;
    private List<String> goldItemIds;
    private Double totalInterestReceivable;
    private Double interestPaidSoFar;
    private Double amountPaidSoFar;
    private Double outstandingAmount;
    private LocalDateTime lastPaymentDate;
    private Boolean smsNotifications = true;
}
