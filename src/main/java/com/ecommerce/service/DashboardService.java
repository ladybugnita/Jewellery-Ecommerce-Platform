package com.ecommerce.service;

import com.ecommerce.dto.DashboardResponse;
import com.ecommerce.model.DashboardSummary;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final CustomerLoanService customerLoanService;
    private final BankLoanService bankLoanService;
    private final CustomerRepository customerRepository;
    private final GoldItemRepository goldItemRepository;
    private final DashboardSummaryRepository dashboardSummaryRepository;

    public DashboardResponse getDashboardMetrics() {
        Double totalInvestment = customerLoanService.getTotalInvestment();
        Double totalReceivableInterest = customerLoanService.getTotalReceivableInterest();
        Double totalPayableInterest = bankLoanService.getTotalPayableInterest();
        Double totalBankLoans = bankLoanService.getTotalBankLoans();
        Long activeCustomerLoans = (long) customerLoanService.getAllActiveLoans().size();
        Long activeBankLoans = (long) bankLoanService.getAllActiveBankLoans().size();
        long totalCustomers = customerRepository.count();

        Double totalGoldWeight = goldItemRepository.findAll().stream()
                .filter(item -> "PLEDGED".equals(item.getStatus()) || "PLEDGED_TO_BANK".equals(item.getStatus()))
                .mapToDouble(item -> item.getWeightInGrams())
                .sum();
        Double netProfit = totalReceivableInterest - totalPayableInterest;

        Map<String, Object> monthlyTrend = generateMonthlyTrend();
        Map<String, Object> statusDistribution = generateStatusDistribution();

        return DashboardResponse.builder()
                .totalInvestment(totalInvestment)
                .totalReceivableInterest(totalReceivableInterest)
                .totalPayableInterest(totalPayableInterest)
                .totalBankLoans(totalBankLoans)
                .netProfit(netProfit)
                .activeCustomerLoans(activeCustomerLoans)
                .activeBankLoans(activeBankLoans)
                .totalCustomers(totalCustomers)
                .totalGoldWeightPledged(totalGoldWeight)
                .monthlyLoanTrend(monthlyTrend)
                .loanStatusDistribution(statusDistribution)
                .build();
    }
    public DashboardSummary saveDashboardSnapshot() {
        DashboardResponse metrics = getDashboardMetrics();

        DashboardSummary summary = new DashboardSummary();
        summary.setSummaryDate(LocalDateTime.now());
        summary.setTotalInvestment(metrics.getTotalInvestment());
        summary.setTotalReceivableInterest(metrics.getTotalReceivableInterest());
        summary.setTotalPayableInterest(metrics.getTotalPayableInterest());
        summary.setTotalBankLoans(metrics.getTotalBankLoans());
        summary.setLastUpdated(LocalDateTime.now());

        return dashboardSummaryRepository.save(summary);
    }

    private Map<String, Object> generateMonthlyTrend() {
        Map<String, Object> trend = new HashMap<>();
        trend.put("labels", new String[]{"Jan","Feb","Mar", "Apr", "May", "Jun"});
        trend.put("data", new Double[]{150000.0, 175000.0, 200000.0, 225000.0, 250000.0, 275000.0});
        return trend;
    }
    private Map<String, Object> generateStatusDistribution() {
        Map<String, Object> distribution = new HashMap<>();
        distribution.put("labels", new String[]{"Active", "Closed", "Defaulted"});
        distribution.put("data", new Integer[]{45, 30, 5});
        return distribution;
    }
}
