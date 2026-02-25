package com.ecommerce.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.List;

@Data
public class BankLoanRequest {
    @NotBlank(message = "Bank name is required")
    private String bankName;

    @NotNull(message = "Principal amount is required")
    @Positive(message = "Principal amount must be positive")
    private Double principalAmount;

    @NotNull(message = "Interest rate is required")
    @DecimalMin(value = "0.1", message = "Interest rate must be at least 0.1%")
    @DecimalMax(value = "3.0", message = "Interest rate cannot exceed 3%")
    private Double interestRate;

    @NotNull(message = "Tenure months is required")
    @Min(value = 1, message = "Tenure must be at least 1 month")
    @Max(value = 60, message = "Tenure cannot exceed 60 months")
    private Integer tenureMonths;

    private List<String> goldItemIds;
}
