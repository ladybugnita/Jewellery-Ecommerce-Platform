package com.ecommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "gold_items")
public class GoldItem {
    @Id
    private String id;
    private String customerId;
    private String itemType;
    private Double weightInGrams;
    private String purity;
    private String description;
    private Double estimatedValue;
    private String serialNumber;
    private String status;
    private String imageUrl;
    private String customerLoanId;
    private String loanNumber;
    private String customerSerialNumber;
    private List<String> billAttachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
