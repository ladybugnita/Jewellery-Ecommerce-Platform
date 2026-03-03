package com.ecommerce.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String username;
    private String password;
    private String email;
    private String phoneNumber;

    private String role;

    private List<String> permissions;

    private String employeeId;
    private String department;
    private String designation;
    private LocalDateTime joiningDate;
    private Double salary;

    private Boolean canCreateCustomers = false;
    private Boolean canEditCustomers = false;
    private Boolean canDeleteCustomers = false;
    private Boolean canCreateLoans = false;
    private Boolean canApproveLoans = false;
    private Boolean canProcessPayments = false;
    private Boolean canViewReports = false;
    private Boolean canManageUsers = false;

    private Double maxLoanApprovalLimit;
    private Integer maxLoanTenureMonths;

    private Boolean active = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public boolean hasPermission(String permission) {
        if (permissions == null || permissions.isEmpty()) {
            return false;
        }
        return permissions.contains(permission);
    }

    public boolean hasAnyPermission(String... permissions) {
        if (this.permissions == null || this.permissions.isEmpty()) {
            return false;
        }
        for (String permission : permissions) {
            if (this.permissions.contains(permission)) {
                return true;
            }
        }
        return false;
    }

    public boolean hasAllPermissions(String... permissions) {
        if (this.permissions == null || this.permissions.isEmpty()) {
            return false;
        }
        for (String permission : permissions) {
            if (!this.permissions.contains(permission)) {
                return false;
            }
        }
        return true;
    }
}