package com.ecommerce.dto;

import com.ecommerce.model.BankLoan;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class BankLoanDetailsDTO {
    private BankLoan loan;
    private List<GoldItemCalculationDTO> individualGoldCalculations;
}
