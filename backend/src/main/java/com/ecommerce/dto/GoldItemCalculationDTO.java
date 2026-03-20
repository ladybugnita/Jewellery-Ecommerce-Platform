package com.ecommerce.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GoldItemCalculationDTO {
    private String itemId;
    private String itemType;
    private Double weightInGrams;
    private String purity;
    private Double estimatedValue;
    private String loanNumber; // Customer Loan Serial Number
    private Double allocatedPrincipal;
    private Double allocatedInterest;
    private Double proportion;
}
