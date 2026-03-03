package com.ecommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "customer_loans")
public class CustomerLoan {
    @Id
    private String id;
    private String customerId;
    private String loanNumber;
    private String customerSerialNumber;

    private Double principalAmount;
    private Double interestRate;
    private String interestType;
    private Integer compoundingFrequency;
    private Double monthlyInterestRate;
    private Integer tenureMonths;
    private LocalDateTime startDate;
    private LocalDateTime maturityDate;
    private String status;

    private String approvedBy;
    private LocalDateTime approvalDate;
    private String rejectionReason;
    private String reviewedBy;

    private List<String> goldItemIds;
    private List<Map<String, Object>> goldItemsDetails;
    private List<String> jewelleryPictures;
    private List<String> billAttachments;

    private Double totalInterestReceivable;
    private Double accruedInterest;
    private Double interestPaidSoFar;
    private Double amountPaidSoFar;
    private Double outstandingAmount;
    private LocalDateTime lastPaymentDate;
    private LocalDateTime lastInterestCalculationDate;
    private Boolean smsNotifications = true;

    private Map<String, String> formattedStartDate;
    private Map<String, String> formattedMaturityDate;

    private List<InterestAccrual> interestAccruals;

    private Boolean isBulkLoan = false;
    private String bulkReferenceId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class InterestAccrual {
        private LocalDateTime date;
        private Double openingBalance;
        private Double interestRate;
        private Double interestAmount;
        private Double closingBalance;
        private String period;
        private Map<String, String> formattedDate;
    }
}