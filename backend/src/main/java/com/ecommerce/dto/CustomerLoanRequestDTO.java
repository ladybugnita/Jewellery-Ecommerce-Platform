package com.ecommerce.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.List;

@Data
public class CustomerLoanRequestDTO {

    @NotNull(message = "Principal amount is required")
    @Positive(message = "Principal amount must be positive")
    private Double principalAmount;

    @NotNull(message = "Tenure months is required")
    @Min(value = 1, message = "Tenure must be at least 1 month")
    @Max(value = 36, message = "Tenure cannot exceed 36 months")
    private Integer tenureMonths;

    private List<GoldItemDTO> goldItems;
}