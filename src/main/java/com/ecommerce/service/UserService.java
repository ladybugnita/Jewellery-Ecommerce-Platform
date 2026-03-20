package com.ecommerce.service;

import com.ecommerce.constants.PermissionConstants;
import com.ecommerce.dto.UserRoleRequest;
import com.ecommerce.dto.UserRoleResponse;
import com.ecommerce.model.Customer;
import com.ecommerce.model.User;
import com.ecommerce.repository.CustomerRepository;
import com.ecommerce.dto.UserProfileUpdateRequest;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public UserRoleResponse createUserWithRole(UserRoleRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        if (request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new RuntimeException("Password is required for new user");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(request.getRole());

        if (request.getPermissions() != null && !request.getPermissions().isEmpty()) {
            user.setPermissions(request.getPermissions());
        } else {
            switch (request.getRole()) {
                case PermissionConstants.ROLE_ADMIN:
                    user.setPermissions(Arrays.asList(PermissionConstants.ADMIN_PERMISSIONS));
                    break;
                case PermissionConstants.ROLE_STAFF:
                    user.setPermissions(Arrays.asList(PermissionConstants.STAFF_PERMISSIONS));
                    break;
                case PermissionConstants.ROLE_USER:
                    user.setPermissions(Arrays.asList(PermissionConstants.USER_PERMISSIONS));
                    break;
                default:
                    user.setPermissions(Arrays.asList(PermissionConstants.USER_PERMISSIONS));
                    break;
            }
        }

        user.setEmployeeId(request.getEmployeeId());
        user.setDepartment(request.getDepartment());
        user.setDesignation(request.getDesignation());
        user.setSalary(request.getSalary());
        user.setJoiningDate(LocalDateTime.now());

        user.setCanCreateCustomers(request.getCanCreateCustomers() != null ?
                request.getCanCreateCustomers() : false);
        user.setCanEditCustomers(request.getCanEditCustomers() != null ?
                request.getCanEditCustomers() : false);
        user.setCanDeleteCustomers(request.getCanDeleteCustomers() != null ?
                request.getCanDeleteCustomers() : false);
        user.setCanCreateLoans(request.getCanCreateLoans() != null ?
                request.getCanCreateLoans() : false);
        user.setCanApproveLoans(request.getCanApproveLoans() != null ?
                request.getCanApproveLoans() : false);
        user.setCanProcessPayments(request.getCanProcessPayments() != null ?
                request.getCanProcessPayments() : false);
        user.setCanViewReports(request.getCanViewReports() != null ?
                request.getCanViewReports() : false);
        user.setCanManageUsers(request.getCanManageUsers() != null ?
                request.getCanManageUsers() : false);

        user.setMaxLoanApprovalLimit(request.getMaxLoanApprovalLimit());
        user.setMaxLoanTenureMonths(request.getMaxLoanTenureMonths());

        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        return mapToUserRoleResponse(savedUser);
    }

    public UserRoleResponse updateUserRole(String id, UserRoleRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(request.getRole());

        if (request.getPermissions() != null) {
            user.setPermissions(request.getPermissions());
        }

        user.setEmployeeId(request.getEmployeeId());
        user.setDepartment(request.getDepartment());
        user.setDesignation(request.getDesignation());
        user.setSalary(request.getSalary());

        user.setCanCreateCustomers(request.getCanCreateCustomers());
        user.setCanEditCustomers(request.getCanEditCustomers());
        user.setCanDeleteCustomers(request.getCanDeleteCustomers());
        user.setCanCreateLoans(request.getCanCreateLoans());
        user.setCanApproveLoans(request.getCanApproveLoans());
        user.setCanProcessPayments(request.getCanProcessPayments());
        user.setCanViewReports(request.getCanViewReports());
        user.setCanManageUsers(request.getCanManageUsers());

        user.setMaxLoanApprovalLimit(request.getMaxLoanApprovalLimit());
        user.setMaxLoanTenureMonths(request.getMaxLoanTenureMonths());

        user.setUpdatedAt(LocalDateTime.now());

        User updatedUser = userRepository.save(user);
        return mapToUserRoleResponse(updatedUser);
    }

    public List<UserRoleResponse> getAllUsersByRole(String role) {
        List<User> users;
        if (role != null && !role.isEmpty()) {
            users = userRepository.findByRole(role);
        } else {
            users = userRepository.findAll();
        }
        return users.stream()
                .map(this::mapToUserRoleResponse)
                .collect(Collectors.toList());
    }

    public UserRoleResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return mapToUserRoleResponse(user);
    }

    public void deactivateUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        user.setActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public void activateUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        user.setActive(true);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public boolean hasPermission(String userId, String permission) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.hasPermission(permission);
    }

    public boolean canApproveLoan(String userId, Double loanAmount, Integer tenureMonths) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getCanApproveLoans()) {
            return false;
        }

        if (user.getMaxLoanApprovalLimit() != null && loanAmount > user.getMaxLoanApprovalLimit()) {
            return false;
        }

        if (user.getMaxLoanTenureMonths() != null && tenureMonths > user.getMaxLoanTenureMonths()) {
            return false;
        }

        return true;
    }

    public Customer createCustomer(Customer customer) {
        customer.setPassword(passwordEncoder.encode(customer.getPassword()));
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());
        customer.setRole("CUSTOMER");
        return customerRepository.save(customer);
    }

    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public Optional<User> findUserById(String id) {
        return userRepository.findById(id);
    }

    public User getUserByIdDirect(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> getUserByEmail(String email) {

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            System.out.println("Found in users collection: " + userOpt.get().getId() + " - Role: " + userOpt.get().getRole());
            return userOpt;
        }

        System.out.println("Not found in users collection, trying customers collection...");
        Optional<Customer> customerOpt = customerRepository.findByEmail(email);
        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            System.out.println("Found in customers collection: " + customer.getId() + " - Role: " + customer.getRole());
            return Optional.of(customer);
        }

        System.out.println("USER NOT FOUND IN ANY COLLECTION for email: " + email);
        return Optional.empty();
    }

    public Customer getCustomerByEmail(String email) {
        return customerRepository.findByEmail(email).orElse(null);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateUser(String id, User userDetails) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setEmail(userDetails.getEmail());
                    user.setPhoneNumber(userDetails.getPhoneNumber());
                    user.setUpdatedAt(LocalDateTime.now());
                    return userRepository.save(user);
                })
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public Customer findCustomerByEmail(String email) {
        return customerRepository.findByEmail(email).orElse(null);
    }

    public long getTotalCustomers() {
        return userRepository.countByRole("CUSTOMER");
    }

    public boolean changePassword(String email, String currentPassword, String newPassword) {

        Optional<User> userOpt = userRepository.findByEmail(email);
        Optional<Customer> customerOpt = customerRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            System.out.println("Found user in users collection");

            boolean matches = passwordEncoder.matches(currentPassword, user.getPassword());
            System.out.println("Password matches: " + matches);

            if (!matches) {
                return false;
            }
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            System.out.println("Password changed successfully for user");

            notificationService.createNotification(
                    user.getId(),
                    "Password Changed",
                    "Your password was successfully changed.",
                    "PASSWORD_CHANGED",
                    null
            );

            return true;

        } else if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();

            boolean matches = passwordEncoder.matches(currentPassword, customer.getPassword());
            System.out.println("Password matches: " + matches);

            if (!matches) {
                return false;
            }

            customer.setPassword(passwordEncoder.encode(newPassword));
            customer.setUpdatedAt(LocalDateTime.now());
            customerRepository.save(customer);
            System.out.println("Password changed successfully for customer");

            notificationService.createNotification(
                    customer.getId(),
                    "Password Changed",
                    "Your password was successfully changed.",
                    "PASSWORD_CHANGED",
                    null
            );

            return true;
        }

        System.out.println("User not found with email: " + email);
        return false;
    }

    private UserRoleResponse mapToUserRoleResponse(User user) {
        return UserRoleResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .employeeId(user.getEmployeeId())
                .department(user.getDepartment())
                .designation(user.getDesignation())
                .salary(user.getSalary())
                .permissions(user.getPermissions())
                .canCreateCustomers(user.getCanCreateCustomers())
                .canEditCustomers(user.getCanEditCustomers())
                .canDeleteCustomers(user.getCanDeleteCustomers())
                .canCreateLoans(user.getCanCreateLoans())
                .canApproveLoans(user.getCanApproveLoans())
                .canProcessPayments(user.getCanProcessPayments())
                .canViewReports(user.getCanViewReports())
                .canManageUsers(user.getCanManageUsers())
                .maxLoanApprovalLimit(user.getMaxLoanApprovalLimit())
                .maxLoanTenureMonths(user.getMaxLoanTenureMonths())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
    public Customer updateCustomerProfile(String customerId, UserProfileUpdateRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        customer.setFullName(request.getFullName());
        customer.setPhoneNumber(request.getPhoneNumber());
        customer.setAddress(request.getAddress());
        customer.setOccupation(request.getOccupation());
        customer.setAnnualIncome(request.getAnnualIncome());
        customer.setIdProof(request.getIdProof());
        customer.setIdProofNumber(request.getIdProofNumber());
        customer.setProfileImage(request.getProfileImage());
        customer.setUpdatedAt(LocalDateTime.now());

        return customerRepository.save(customer);
    }
}