package com.ecommerce.controller;

import com.ecommerce.model.*;
import com.ecommerce.service.*;
import com.ecommerce.dto.*;
import com.ecommerce.repository.GoldItemRepository;
import com.ecommerce.repository.CustomerRepository;
import com.ecommerce.service.GoldItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.ecommerce.dto.UserProfileUpdateRequest;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final NotificationService notificationService;
    private final UserService userService;
    private final CustomerLoanService customerLoanService;
    private final GoldItemRepository goldItemRepository;
    private final GoldItemService goldItemService;
    private final CustomerRepository customerRepository;

    private String getUserEmail(Authentication authentication) {
        return authentication.getName();
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<?>> getProfile(Authentication authentication) {
        String email = getUserEmail(authentication);
        Optional<User> userOpt = userService.getUserByEmail(email);

        if (userOpt.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(userOpt.get()));
        }
        return ResponseEntity.status(404).body(ApiResponse.error("Profile not found"));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard(Authentication authentication) {
        String email = getUserEmail(authentication);
        Customer customer = userService.getCustomerByEmail(email);

        if (customer == null) {
            Optional<User> userOpt = userService.getUserByEmail(email);
            if (userOpt.isPresent() && "STAFF".equals(userOpt.get().getRole())) {
                Map<String, Object> staffData = new HashMap<>();
                long totalCustomers = customerRepository.count();
                long totalActiveLoans = customerLoanService.getAllActiveLoans().size();
                long pendingApprovals = customerLoanService.getPendingApprovalLoans().size();

                staffData.put("totalCustomers", totalCustomers);
                staffData.put("totalActiveLoans", totalActiveLoans);
                staffData.put("pendingApprovals", pendingApprovals);
                return ResponseEntity.ok(ApiResponse.success(Map.of("staffData", staffData)));
            } else {
                Map<String, Object> userData = new HashMap<>();
                userData.put("message", "Welcome to your dashboard");
                userData.put("features", List.of("View profile", "Change password"));
                return ResponseEntity.ok(ApiResponse.success(userData));
            }
        }

        List<CustomerLoan> loans = customerLoanService.getCustomerLoans(customer.getId());
        List<GoldItem> goldItems = goldItemRepository.findByCustomerId(customer.getId());

        long activeLoans = loans.stream().filter(l -> "ACTIVE".equals(l.getStatus())).count();
        List<CustomerLoan> recentLoans = loans.stream()
                .sorted(Comparator.comparing(CustomerLoan::getStartDate).reversed())
                .limit(5)
                .collect(Collectors.toList());

        Map<String, Object> customerData = new HashMap<>();
        customerData.put("totalLoans", loans.size());
        customerData.put("activeLoans", activeLoans);
        customerData.put("totalGoldItems", goldItems.size());
        customerData.put("recentLoans", recentLoans);

        Map<String, String> currentDate = new HashMap<>();
        currentDate.put("english", LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")));
        currentDate.put("nepali", "2082/11/27");

        Map<String, Object> response = new HashMap<>();
        response.put("customerData", customerData);
        response.put("currentDate", currentDate);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-loans")
    public ResponseEntity<ApiResponse<List<CustomerLoan>>> getMyLoans(Authentication authentication) {
        String email = getUserEmail(authentication);
        Customer customer = userService.getCustomerByEmail(email);
        if (customer == null) return ResponseEntity.status(404).body(ApiResponse.error("Customer not found"));

        return ResponseEntity.ok(ApiResponse.success(customerLoanService.getCustomerLoans(customer.getId())));
    }

    @GetMapping("/my-loans/{id}")
    public ResponseEntity<ApiResponse<CustomerLoan>> getMyLoanById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(customerLoanService.getLoanById(id)));
    }

    @GetMapping("/my-gold-items")
    public ResponseEntity<ApiResponse<List<GoldItemDetailResponse>>> getMyGoldItems(Authentication authentication) {
        String email = getUserEmail(authentication);
        Customer customer = userService.getCustomerByEmail(email);
        if (customer == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Customer not found"));
        }
        List<GoldItemDetailResponse> items = goldItemService.getGoldItemsWithLoanDetails(customer.getId());
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @PostMapping("/request-loan")
    public ResponseEntity<ApiResponse<CustomerLoan>> requestLoan(
            Authentication authentication, @RequestBody CustomerLoanRequestDTO request) {
        String email = getUserEmail(authentication);
        Customer customer = userService.getCustomerByEmail(email);
        if (customer == null) return ResponseEntity.status(404).body(ApiResponse.error("Customer not found"));

        CustomerLoan loan = customerLoanService.createLoanFromCustomerRequest(customer.getId(), request);
        return new ResponseEntity<>(ApiResponse.success("Loan request submitted with " + request.getGoldItems().size() + " gold items", loan), HttpStatus.CREATED);
    }

    @GetMapping("/my-pending-loans")
    public ResponseEntity<ApiResponse<List<CustomerLoan>>> getMyPendingLoans(Authentication authentication) {
        String email = getUserEmail(authentication);
        Customer customer = userService.getCustomerByEmail(email);
        if (customer == null) return ResponseEntity.status(404).body(ApiResponse.error("Customer not found"));

        List<CustomerLoan> pending = customerLoanService.getCustomerLoans(customer.getId()).stream()
                .filter(l -> "PENDING_APPROVAL".equals(l.getStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(pending));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary(Authentication authentication) {
        String email = getUserEmail(authentication);
        Customer customer = userService.getCustomerByEmail(email);
        if (customer == null) return ResponseEntity.status(404).body(ApiResponse.error("Customer not found"));

        Map<String, Object> summary = new HashMap<>();
        summary.put("loanCount", customerLoanService.getCustomerLoans(customer.getId()).size());
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            Authentication authentication, @RequestBody ChangePasswordRequest request) {
        String email = getUserEmail(authentication);
        boolean success = userService.changePassword(email, request.getCurrentPassword(), request.getNewPassword());

        if (success) {
            return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
        } else {
            return ResponseEntity.status(400).body(ApiResponse.error("Incorrect current password"));
        }
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications(Authentication authentication) {
        String email = getUserEmail(authentication);
        Optional<User> userOpt = userService.getUserByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body(ApiResponse.error("User not found"));

        String userId = userOpt.get().getId();
        boolean isAdmin = userOpt.get().getRole().equals("ADMIN");
        
        List<Notification> notifications = notificationService.getUserNotifications(userId);
        if (isAdmin) {
            notifications.addAll(notificationService.getUserNotifications("ADMIN"));
            notifications.sort(Comparator.comparing(Notification::getCreatedAt).reversed());
        }
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadNotificationCount(Authentication authentication) {
        String email = getUserEmail(authentication);
        Optional<User> userOpt = userService.getUserByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body(ApiResponse.error("User not found"));

        String userId = userOpt.get().getId();
        boolean isAdmin = userOpt.get().getRole().equals("ADMIN");
        
        long count = notificationService.getUnreadCount(userId);
        if (isAdmin) {
            count += notificationService.getUnreadCount("ADMIN");
        }
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @PostMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<String>> markNotificationAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read"));
    }

    @PostMapping("/notifications/read-all")
    public ResponseEntity<ApiResponse<String>> markAllNotificationsAsRead(Authentication authentication) {
        String email = getUserEmail(authentication);
        Optional<User> userOpt = userService.getUserByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body(ApiResponse.error("User not found"));

        notificationService.markAllAsRead(userOpt.get().getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Customer>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UserProfileUpdateRequest request) {
        String email = getUserEmail(authentication);
        Customer customer = userService.getCustomerByEmail(email);
        if (customer == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Customer not found"));
        }

        Customer updatedCustomer = userService.updateCustomerProfile(customer.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updatedCustomer));
    }
}
