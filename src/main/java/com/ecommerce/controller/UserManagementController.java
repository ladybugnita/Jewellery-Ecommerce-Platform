package com.ecommerce.controller;

import com.ecommerce.dto.ApiResponse;
import com.ecommerce.dto.UserRoleRequest;
import com.ecommerce.dto.UserRoleResponse;
import com.ecommerce.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {

    private final UserService userService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<UserRoleResponse>> createUser(
            @Valid @RequestBody UserRoleRequest request) {
        UserRoleResponse response = userService.createUserWithRole(request);
        return new ResponseEntity<>(
                ApiResponse.success("User created successfully", response),
                HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserRoleResponse>> updateUser(
            @PathVariable String id,
            @Valid @RequestBody UserRoleRequest request) {
        UserRoleResponse response = userService.updateUserRole(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserRoleResponse>>> getAllUsers(
            @RequestParam(required = false) String role) {
        List<UserRoleResponse> users = userService.getAllUsersByRole(role);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserRoleResponse>> getUserById(@PathVariable String id) {
        UserRoleResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable String id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deactivated successfully", null));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activateUser(@PathVariable String id) {
        userService.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User activated successfully", null));
    }

    @GetMapping("/{id}/permissions/{permission}")
    public ResponseEntity<ApiResponse<Boolean>> checkPermission(
            @PathVariable String id,
            @PathVariable String permission) {
        boolean hasPermission = userService.hasPermission(id, permission);
        return ResponseEntity.ok(ApiResponse.success(hasPermission));
    }

    @GetMapping("/{id}/can-approve-loan")
    public ResponseEntity<ApiResponse<Boolean>> canApproveLoan(
            @PathVariable String id,
            @RequestParam Double amount,
            @RequestParam Integer tenureMonths) {
        boolean canApprove = userService.canApproveLoan(id, amount, tenureMonths);
        return ResponseEntity.ok(ApiResponse.success(canApprove));
    }
}