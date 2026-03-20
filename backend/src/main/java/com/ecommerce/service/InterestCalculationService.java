package com.ecommerce.service;

import com.ecommerce.model.CustomerLoan;
import com.ecommerce.model.CustomerLoan.InterestAccrual;
import com.ecommerce.utils.DateUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class InterestCalculationService {

    public double calculateCompoundInterest(double principal, double annualRate, int tenureMonths) {
        double rate = annualRate / 100;
        double time = tenureMonths / 12.0;
        int frequency = 12;

        double amount = principal * Math.pow(1 + (rate / frequency), frequency * time);
        return amount - principal;
    }

    public double calculateSimpleInterest(double principal, double monthlyRate, int tenureMonths) {
        return principal * (monthlyRate / 100) * tenureMonths;
    }

    public double calculateAccruedInterest(CustomerLoan loan, LocalDateTime asOfDate) {
        if (asOfDate.isAfter(loan.getMaturityDate())) {
            asOfDate = loan.getMaturityDate();
        }

        long daysElapsed = DateUtil.getDaysBetween(loan.getStartDate(), asOfDate);
        long totalDays = DateUtil.getDaysBetween(loan.getStartDate(), loan.getMaturityDate());

        if ("COMPOUND".equals(loan.getInterestType())) {
            double annualRate = loan.getInterestRate();
            int frequency = 12;
            double timeInYears = daysElapsed / 365.0;

            double amount = loan.getPrincipalAmount() *
                    Math.pow(1 + (annualRate / 100 / frequency), frequency * timeInYears);
            return amount - loan.getPrincipalAmount();
        } else {
            double totalInterest = loan.getTotalInterestReceivable();
            return totalInterest * daysElapsed / totalDays;
        }
    }

    public List<InterestAccrual> generateAccrualSchedule(CustomerLoan loan) {
        List<InterestAccrual> schedule = new ArrayList<>();
        LocalDateTime currentDate = loan.getStartDate();
        double balance = loan.getPrincipalAmount();

        while (currentDate.isBefore(loan.getMaturityDate())) {
            LocalDateTime nextDate = currentDate.plusMonths(1);
            if (nextDate.isAfter(loan.getMaturityDate())) {
                nextDate = loan.getMaturityDate();
            }

            long daysInPeriod = DateUtil.getDaysBetween(currentDate, nextDate);

            InterestAccrual accrual = new InterestAccrual();
            accrual.setDate(currentDate);
            accrual.setOpeningBalance(balance);
            accrual.setFormattedDate(DateUtil.getFormattedDates(currentDate));

            if ("COMPOUND".equals(loan.getInterestType())) {
                double annualRate = loan.getInterestRate() / 100;
                int frequency = 12;
                double timeInYears = daysInPeriod / 365.0;

                double interest = balance * (Math.pow(1 + annualRate / frequency, frequency * timeInYears) - 1);
                accrual.setInterestAmount(interest);
                balance += interest;
            } else {
                double monthlyRate = loan.getMonthlyInterestRate() != null ?
                        loan.getMonthlyInterestRate() : loan.getInterestRate();
                double interest = balance * (monthlyRate / 100) * (daysInPeriod / 30.0);
                accrual.setInterestAmount(interest);
                balance += interest;
            }

            accrual.setClosingBalance(balance);
            accrual.setPeriod("MONTH");
            accrual.setInterestRate(loan.getInterestRate());

            schedule.add(accrual);
            currentDate = nextDate;
        }

        return schedule;
    }
}