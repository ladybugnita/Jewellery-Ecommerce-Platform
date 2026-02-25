package com.ecommerce.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class DashboardResponse {
    private Double totalInvestment;
    private Double totalReceivableInterest;
    private Double totalPayableInterest;
    private Double totalBankLoans;
    private Double netProfit;

    private Long activeCustomerLoans;
    private Long activeBankLoans;
    private Long totalCustomers;
    private Double totalGoldWeightPledged;

    private Object monthlyLoanTrend;
    private Object loanStatusDistribution;
}
