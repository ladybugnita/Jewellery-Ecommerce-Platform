package com.ecommerce.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class LoanApprovalRequest {
    @NotBlank(message = "Loan ID is required")
    private String loanId;

    private Boolean approved;
    private String rejectionReason;
}