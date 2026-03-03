package com.ecommerce.service;

import com.ecommerce.model.CustomerLoan;
import com.ecommerce.model.Notification;
import com.ecommerce.model.User;
import com.ecommerce.repository.NotificationRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void createLoanRequestNotification(CustomerLoan loan, String customerName) {
        List<User> approvers = userRepository.findByRoleInAndCanApproveLoansTrue(
                List.of("ADMIN", "STAFF")
        );

        for (User approver : approvers) {
            Notification notification = new Notification();
            notification.setType("LOAN_REQUEST");
            notification.setTitle("New Loan Request Pending Approval");
            notification.setMessage(
                    String.format("Customer %s has requested a loan of NPR %.2f. Loan Number: %s",
                            customerName, loan.getPrincipalAmount(), loan.getLoanNumber())
            );
            notification.setUserId(approver.getId());
            notification.setRole(approver.getRole());
            notification.setReferenceId(loan.getId());

            Map<String, Object> data = new HashMap<>();
            data.put("customerId", loan.getCustomerId());
            data.put("customerName", customerName);
            data.put("loanNumber", loan.getLoanNumber());
            data.put("principalAmount", loan.getPrincipalAmount());
            data.put("tenureMonths", loan.getTenureMonths());
            data.put("interestRate", loan.getInterestRate());
            notification.setData(data);

            notification.setCreatedAt(LocalDateTime.now());
            notification.setIsRead(false);

            notificationRepository.save(notification);
        }
    }

    public void createLoanApprovedNotification(CustomerLoan loan, String customerId, String approverName) {
        Notification notification = new Notification();
        notification.setType("LOAN_APPROVED");
        notification.setTitle("Loan Request Approved");
        notification.setMessage(
                String.format("Your loan request %s for NPR %.2f has been approved by %s.",
                        loan.getLoanNumber(), loan.getPrincipalAmount(), approverName)
        );
        notification.setUserId(customerId);
        notification.setRole("CUSTOMER");
        notification.setReferenceId(loan.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("loanId", loan.getId());
        data.put("loanNumber", loan.getLoanNumber());
        data.put("principalAmount", loan.getPrincipalAmount());
        data.put("approvalDate", LocalDateTime.now());
        data.put("approvedBy", approverName);
        notification.setData(data);

        notification.setCreatedAt(LocalDateTime.now());
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }

    public void createLoanRejectedNotification(CustomerLoan loan, String customerId, String rejectionReason, String reviewerName) {
        Notification notification = new Notification();
        notification.setType("LOAN_REJECTED");
        notification.setTitle("Loan Request Rejected");
        notification.setMessage(
                String.format("Your loan request %s has been rejected. Reason: %s",
                        loan.getLoanNumber(), rejectionReason)
        );
        notification.setUserId(customerId);
        notification.setRole("CUSTOMER");
        notification.setReferenceId(loan.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("loanId", loan.getId());
        data.put("loanNumber", loan.getLoanNumber());
        data.put("rejectionReason", rejectionReason);
        data.put("reviewedBy", reviewerName);
        notification.setData(data);

        notification.setCreatedAt(LocalDateTime.now());
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsForUser(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotificationsForRole(String role) {
        return notificationRepository.findByRoleAndIsReadFalseOrderByCreatedAtDesc(role);
    }

    public Long getUnreadCountForUser(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public Long getUnreadCountForRole(String role) {
        return notificationRepository.countByRoleAndIsReadFalse(role);
    }

    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        });
    }

    public void markAllAsReadForUser(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(notification -> {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
        });
        notificationRepository.saveAll(unread);
    }
}