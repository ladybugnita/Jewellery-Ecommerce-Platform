package com.ecommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "transactions")
public class Transaction {
    @Id
    private String id;
    private String transactionType;
    private String referenceId;
    private Double amount;
    private String description;
    private LocalDateTime transactionDate;
    private String paymentMode;
    private String status;
}
