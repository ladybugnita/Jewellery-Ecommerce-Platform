package com.ecommerce.dto;

import lombok.Data;
import java.util.List;

@Data
public class CustomerLoanRequestDTO {
    private Double principalAmount;
    private Integer tenureMonths;
    private List<GoldItemDTO> goldItems;
    private String customerSerialNumber;
    private Boolean autoGenerateSerialNumber = true;
}

