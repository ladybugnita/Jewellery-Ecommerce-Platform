package com.ecommerce.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.List;

@Data
public class CustomerLoanRequest {
    @NotBlank(message = "Customer ID is required")
    private String customerId;

    @NotNull(message = "principal amount is required")
    @Positive(message = "Principal amount  must be positive")
    private Double principalAmount;

    @NotNull(message = "Interest rate is required")
    @DecimalMin(value = "0.1", message = "Interest rate must be at least 0.1%")
    @DecimalMax(value = "5.0", message = "Interest rate cannot exceed 5%")
    private Double interestRate;

    @NotNull(message = "Tenure months is required")
    @Min(value = 1, message = "Tenure must be at least 1 month")
    @Max(value = 36, message = "Tenure cannot exceed 36 months")
    private Integer tenureMonths;

    @NotEmpty(message = "At least one gold item must be pledged")
    private List<String> goldItemIds;
}
