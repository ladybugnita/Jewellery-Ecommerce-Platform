package com.ecommerce.controller;

import com.ecommerce.dto.ApiResponse;
import com.ecommerce.model.AdminSettings;
import com.ecommerce.repository.AdminSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping("/api/admin-management")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminManagementController {
    private final AdminSettingsRepository adminSettingsRepository;

    @GetMapping("/admins")
    public ResponseEntity<ApiResponse<List<String>>> getAllAdminEmails() {
        AdminSettings settings = getAdminSettings();
        return ResponseEntity.ok(ApiResponse.success(settings.getAdminEmails()));
    }

    @PostMapping("/admins/add")
    public ResponseEntity<ApiResponse<List<String>>> addAdminEmail(@RequestParam String email) {
        AdminSettings settings = getAdminSettings();

        if(!settings.getAdminEmails().contains(email)){
            settings.getAdminEmails().add(email);
            adminSettingsRepository.save(settings);
        }
        return ResponseEntity.ok(ApiResponse.success("Admin added successfully", settings.getAdminEmails()));
    }
    @DeleteMapping("/admins/remove")
    public ResponseEntity<ApiResponse<List<String>>> removeAdminEmail(@RequestParam String email) {
        AdminSettings settings = getAdminSettings();

        settings.getAdminEmails().remove(email);
        adminSettingsRepository.save(settings);

        return ResponseEntity.ok(ApiResponse.success("Admin removed successfully", settings.getAdminEmails()));
    }

    private AdminSettings getAdminSettings() {
        return adminSettingsRepository.findById("admin-config")
                .orElseGet(() -> {
                    AdminSettings newSettings = new AdminSettings();
                    newSettings.setId("admin-config");
                    return adminSettingsRepository.save(newSettings);
                });
    }

    @PostMapping("/init-first-admin")
    public ResponseEntity<ApiResponse<String>> initFirstAdmin(@RequestParam String email){
        AdminSettings settings = getAdminSettings();

        if(settings.getAdminEmails().isEmpty()) {
            settings.getAdminEmails().add(email);
            adminSettingsRepository.save(settings);
            return ResponseEntity.ok(ApiResponse.success("First admin initialized", email));
        }
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("Admins already exist. Use add endpoint instead."));
    }
}
