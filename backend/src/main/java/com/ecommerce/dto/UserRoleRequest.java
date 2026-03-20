package com.ecommerce.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.List;

@Data
public class UserRoleRequest {
    @NotBlank(message = "Username is required")
    private String username;

    private String password;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Role is required")
    private String role;

    private String employeeId;
    private String department;
    private String designation;
    private Double salary;

    private List<String> permissions;

    private Boolean canCreateCustomers = false;
    private Boolean canEditCustomers = false;
    private Boolean canDeleteCustomers = false;
    private Boolean canCreateLoans = false;
    private Boolean canApproveLoans = false;
    private Boolean canProcessPayments = false;
    private Boolean canViewReports = false;
    private Boolean canManageUsers = false;

    @DecimalMin(value = "0", message = "Max loan approval limit must be positive")
    private Double maxLoanApprovalLimit;

    @Min(value = 1, message = "Max loan tenure must be at least 1 month")
    private Integer maxLoanTenureMonths;
}