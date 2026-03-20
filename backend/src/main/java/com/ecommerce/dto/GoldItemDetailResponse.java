package com.ecommerce.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class GoldItemDetailResponse {
    private String id;
    private String itemType;
    private Double weightInGrams;
    private String purity;
    private String description;
    private Double estimatedValue;
    private String status;
    private String imageUrl;
    private String serialNumber;
    private List<String> billAttachments;
    private String customerId;
    private String customerName;
    private String customerLoanId;
    private String customerSerialNumber;
    private String bankLoanId;
    private String bankSerialNumber;
    private String loanNumber;
}
