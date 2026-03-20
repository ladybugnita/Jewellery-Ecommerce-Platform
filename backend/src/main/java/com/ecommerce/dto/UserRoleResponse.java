package com.ecommerce.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserRoleResponse {
    private String id;
    private String username;
    private String email;
    private String phoneNumber;
    private String role;
    private String employeeId;
    private String department;
    private String designation;
    private Double salary;
    private List<String> permissions;
    private Boolean canCreateCustomers;
    private Boolean canEditCustomers;
    private Boolean canDeleteCustomers;
    private Boolean canCreateLoans;
    private Boolean canApproveLoans;
    private Boolean canProcessPayments;
    private Boolean canViewReports;
    private Boolean canManageUsers;
    private Double maxLoanApprovalLimit;
    private Integer maxLoanTenureMonths;
    private Boolean active;
    private LocalDateTime createdAt;
}