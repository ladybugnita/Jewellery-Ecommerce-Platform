package com.ecommerce.controller;

import com.ecommerce.dto.ApiResponse;
import com.ecommerce.dto.ChangePasswordRequest;
import com.ecommerce.dto.CustomerLoanRequestDTO;
import com.ecommerce.model.Customer;
import com.ecommerce.model.CustomerLoan;
import com.ecommerce.model.GoldItem;
import com.ecommerce.model.Notification;
import com.ecommerce.model.User;
import com.ecommerce.service.CustomerLoanService;
import com.ecommerce.service.GoldItemService;
import com.ecommerce.service.NotificationService;
import com.ecommerce.service.UserService;
import com.ecommerce.utils.DateUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'STAFF', 'CUSTOMER')")
public class UserController {

    private final CustomerLoanService customerLoanService;
    private final GoldItemService goldItemService;
    private final UserService userService;
    private final NotificationService notificationService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        var userOpt = userService.getUserByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("User not found"));
        }

        var user = userOpt.get();
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("email", user.getEmail());
        profile.put("phoneNumber", user.getPhoneNumber());
        profile.put("role", user.getRole());
        profile.put("active", user.getActive());

        if ("CUSTOMER".equals(user.getRole())) {
            Customer customer = userService.findCustomerByEmail(email);
            if (customer != null) {
                profile.put("fullName", customer.getFullName());
                profile.put("address", customer.getAddress());
                profile.put("occupation", customer.getOccupation());
                profile.put("annualIncome", customer.getAnnualIncome());
                profile.put("idProof", customer.getIdProof());
                profile.put("idProofNumber", customer.getIdProofNumber());
                profile.put("signature", customer.getSignature());
            }
        }

        if (user.getPermissions() != null) {
            profile.put("permissions", user.getPermissions());
        }

        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserDashboard() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        var userOpt = userService.getUserByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("User not found"));
        }

        var user = userOpt.get();
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("role", user.getRole());
        dashboard.put("greeting", getGreetingMessage(user.getUsername()));
        dashboard.put("currentDate", DateUtil.getFormattedDates(LocalDateTime.now()));

        switch (user.getRole()) {
            case "CUSTOMER":
                Customer customer = userService.findCustomerByEmail(email);
                if (customer != null) {
                    List<CustomerLoan> customerLoans = customerLoanService.getCustomerLoans(customer.getId());
                    List<GoldItem> customerGoldItems = goldItemService.getGoldItemsByCustomerId(customer.getId());

                    Map<String, Object> customerData = new HashMap<>();
                    customerData.put("totalLoans", customerLoans.size());
                    customerData.put("activeLoans", customerLoans.stream()
                            .filter(l -> "ACTIVE".equals(l.getStatus())).count());
                    customerData.put("totalLoanAmount", customerLoans.stream()
                            .mapToDouble(CustomerLoan::getPrincipalAmount).sum());
                    customerData.put("totalGoldItems", customerGoldItems.size());

                    customerData.put("recentLoans", customerLoans.stream()
                            .limit(5)
                            .map(loan -> {
                                Map<String, Object> loanMap = new HashMap<>();
                                loanMap.put("id", loan.getId());
                                loanMap.put("loanNumber", loan.getLoanNumber());
                                loanMap.put("principalAmount", loan.getPrincipalAmount());
                                loanMap.put("status", loan.getStatus());
                                loanMap.put("startDate", loan.getStartDate());
                                loanMap.put("maturityDate", loan.getMaturityDate());
                                return loanMap;
                            })
                            .collect(Collectors.toList()));

                    dashboard.put("customerData", customerData);
                }
                break;

            case "STAFF":
                Map<String, Object> staffData = new HashMap<>();
                staffData.put("totalCustomers", userService.getTotalCustomers());
                staffData.put("totalActiveLoans", customerLoanService.getAllActiveLoans().size());
                staffData.put("totalLoanAmount", customerLoanService.getTotalInvestment());
                staffData.put("pendingApprovals", customerLoanService.getPendingApprovals());

                dashboard.put("staffData", staffData);
                break;

            case "USER":
                Map<String, Object> userData = new HashMap<>();
                userData.put("message", "Welcome to the User Dashboard");
                userData.put("features", List.of(
                        "View Profile",
                        "Change Password",
                        "View Notifications"
                ));
                dashboard.put("userData", userData);
                break;
        }

        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }

    @GetMapping("/my-loans")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyLoans() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        Customer customer = userService.findCustomerByEmail(email);
        if (customer == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Customer not found"));
        }

        List<CustomerLoan> loans = customerLoanService.getCustomerLoans(customer.getId());

        List<Map<String, Object>> formattedLoans = loans.stream()
                .map(loan -> {
                    Map<String, Object> loanMap = new HashMap<>();
                    loanMap.put("id", loan.getId());
                    loanMap.put("loanNumber", loan.getLoanNumber());
                    loanMap.put("customerSerialNumber", loan.getCustomerSerialNumber());
                    loanMap.put("principalAmount", loan.getPrincipalAmount());
                    loanMap.put("interestRate", loan.getInterestRate());
                    loanMap.put("interestType", loan.getInterestType());
                    loanMap.put("tenureMonths", loan.getTenureMonths());
                    loanMap.put("startDate", loan.getStartDate());
                    loanMap.put("maturityDate", loan.getMaturityDate());
                    loanMap.put("status", loan.getStatus());
                    loanMap.put("outstandingAmount", loan.getOutstandingAmount());
                    loanMap.put("amountPaidSoFar", loan.getAmountPaidSoFar());
                    loanMap.put("interestPaidSoFar", loan.getInterestPaidSoFar());
                    loanMap.put("totalInterestReceivable", loan.getTotalInterestReceivable());
                    loanMap.put("rejectionReason", loan.getRejectionReason());
                    return loanMap;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(formattedLoans));
    }

    @GetMapping("/my-loans/{loanId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyLoanById(@PathVariable String loanId) {
        CustomerLoan loan = customerLoanService.getLoanById(loanId);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        Customer customer = userService.findCustomerByEmail(email);
        if (customer == null || !loan.getCustomerId().equals(customer.getId())) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("Access denied"));
        }

        Map<String, Object> loanMap = new HashMap<>();
        loanMap.put("id", loan.getId());
        loanMap.put("loanNumber", loan.getLoanNumber());
        loanMap.put("customerSerialNumber", loan.getCustomerSerialNumber());
        loanMap.put("principalAmount", loan.getPrincipalAmount());
        loanMap.put("interestRate", loan.getInterestRate());
        loanMap.put("interestType", loan.getInterestType());
        loanMap.put("tenureMonths", loan.getTenureMonths());
        loanMap.put("startDate", loan.getStartDate());
        loanMap.put("maturityDate", loan.getMaturityDate());
        loanMap.put("status", loan.getStatus());
        loanMap.put("outstandingAmount", loan.getOutstandingAmount());
        loanMap.put("amountPaidSoFar", loan.getAmountPaidSoFar());
        loanMap.put("interestPaidSoFar", loan.getInterestPaidSoFar());
        loanMap.put("totalInterestReceivable", loan.getTotalInterestReceivable());
        loanMap.put("rejectionReason", loan.getRejectionReason());
        loanMap.put("goldItemIds", loan.getGoldItemIds());

        return ResponseEntity.ok(ApiResponse.success(loanMap));
    }

    @GetMapping("/my-gold-items")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyGoldItems() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        Customer customer = userService.findCustomerByEmail(email);
        if (customer == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Customer not found"));
        }

        List<GoldItem> goldItems = goldItemService.getGoldItemsByCustomerId(customer.getId());

        List<Map<String, Object>> formattedItems = goldItems.stream()
                .map(item -> {
                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("id", item.getId());
                    itemMap.put("itemType", item.getItemType());
                    itemMap.put("weightInGrams", item.getWeightInGrams());
                    itemMap.put("purity", item.getPurity());
                    itemMap.put("estimatedValue", item.getEstimatedValue());
                    itemMap.put("status", item.getStatus());
                    itemMap.put("serialNumber", item.getSerialNumber());
                    itemMap.put("description", item.getDescription());
                    itemMap.put("imageUrl", item.getImageUrl());
                    return itemMap;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(formattedItems));
    }

    @GetMapping("/my-gold-items/{itemId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyGoldItemById(@PathVariable String itemId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        Customer customer = userService.findCustomerByEmail(email);
        if (customer == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Customer not found"));
        }

        GoldItem goldItem = goldItemService.getGoldItemById(itemId);

        if (!goldItem.getCustomerId().equals(customer.getId())) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("Access denied"));
        }

        Map<String, Object> itemMap = new HashMap<>();
        itemMap.put("id", goldItem.getId());
        itemMap.put("itemType", goldItem.getItemType());
        itemMap.put("weightInGrams", goldItem.getWeightInGrams());
        itemMap.put("purity", goldItem.getPurity());
        itemMap.put("estimatedValue", goldItem.getEstimatedValue());
        itemMap.put("status", goldItem.getStatus());
        itemMap.put("serialNumber", goldItem.getSerialNumber());
        itemMap.put("description", goldItem.getDescription());
        itemMap.put("imageUrl", goldItem.getImageUrl());
        itemMap.put("customerLoanId", goldItem.getCustomerLoanId());
        itemMap.put("bankLoanId", goldItem.getBankLoanId());

        return ResponseEntity.ok(ApiResponse.success(itemMap));
    }

    @PostMapping("/request-loan")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestLoan(
            @Valid @RequestBody CustomerLoanRequestDTO request) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        Customer customer = userService.findCustomerByEmail(email);
        if (customer == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Customer not found"));
        }

        try {
            CustomerLoan loan = customerLoanService.createCustomerLoanRequest(customer.getId(), request);

            Map<String, Object> response = new HashMap<>();
            response.put("loanId", loan.getId());
            response.put("loanNumber", loan.getLoanNumber());
            response.put("status", loan.getStatus());
            response.put("message", "Your loan request has been submitted and is pending approval");

            return ResponseEntity.ok(ApiResponse.success("Loan request submitted successfully", response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to submit loan request: " + e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody ChangePasswordRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        boolean changed = userService.changePassword(email,
                request.getCurrentPassword(),
                request.getNewPassword());

        if (!changed) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Current password is incorrect"));
        }

        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        var userOpt = userService.getUserByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("User not found"));
        }

        List<Notification> notifications = notificationService.getNotificationsForUser(userOpt.get().getId());
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadNotificationCount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        var userOpt = userService.getUserByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("User not found"));
        }

        Long count = notificationService.getUnreadCountForUser(userOpt.get().getId());
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @PostMapping("/notifications/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markNotificationAsRead(@PathVariable String notificationId) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }

    @PostMapping("/notifications/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllNotificationsAsRead() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        var userOpt = userService.getUserByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("User not found"));
        }

        notificationService.markAllAsReadForUser(userOpt.get().getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserSummary() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        var userOpt = userService.getUserByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("User not found"));
        }

        User user = userOpt.get();
        Map<String, Object> summary = new HashMap<>();
        summary.put("username", user.getUsername());
        summary.put("role", user.getRole());
        summary.put("memberSince", DateUtil.getFormattedDates(user.getCreatedAt()));
        summary.put("active", user.getActive());

        if ("CUSTOMER".equals(user.getRole())) {
            Customer customer = userService.findCustomerByEmail(email);
            if (customer != null) {
                List<CustomerLoan> loans = customerLoanService.getCustomerLoans(customer.getId());
                summary.put("totalLoans", loans.size());
                summary.put("activeLoans", loans.stream().filter(l -> "ACTIVE".equals(l.getStatus())).count());
                summary.put("totalGoldItems", goldItemService.getGoldItemsByCustomerId(customer.getId()).size());
            }
        }

        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    private String getGreetingMessage(String username) {
        int hour = LocalDateTime.now().getHour();
        String timeGreeting;

        if (hour < 12) {
            timeGreeting = "Good Morning";
        } else if (hour < 17) {
            timeGreeting = "Good Afternoon";
        } else {
            timeGreeting = "Good Evening";
        }

        return timeGreeting + ", " + username + "!";
    }
}