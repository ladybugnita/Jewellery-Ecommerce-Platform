package com.ecommerce.dto;

import lombok.Data;

@Data
public class LoanSearchRequest {
    private String customerSerialNumber;
    private String bankSerialNumber;
    private String customerId;
    private String loanId;
    private String status;
}
