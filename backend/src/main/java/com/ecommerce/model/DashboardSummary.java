package com.ecommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "dashboard_summaries")
public class DashboardSummary {
    @Id
    private String id;
    private LocalDateTime summaryDate;

    private Double totalInvestment;
    private Double totalReceivableInterest;
    private Double totalPayableInterest;
    private Double totalBankLoans;

    private Integer activeCustomerLoans;
    private Integer activeBankLoans;
    private Double totalGoldWeightPledged;
    private LocalDateTime lastUpdated;
}
