package com.ecommerce.controller;

import com.ecommerce.repository.AdminSettingsRepository;
import com.ecommerce.dto.ApiResponse;
import com.ecommerce.dto.AuthResponse;
import com.ecommerce.dto.LoginRequest;
import com.ecommerce.model.AdminSettings;
import com.ecommerce.model.Customer;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.security.JwtUtil;
import com.ecommerce.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.ecommerce.security.CustomUserDetailsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    @Autowired
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    @Autowired
    private final CustomUserDetailsService userDetailsService;
    private final AdminSettingsRepository adminSettingsRepository;
    @Autowired
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    @Autowired
    private UserRepository userRepository;

    @PostMapping("/debug-complete")
    public ResponseEntity<Map<String, Object>> debugComplete(@RequestBody LoginRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            // 1. Check if user exists in database
            Optional<User> userOpt = userRepository.findByEmail(request.getUsername());

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                response.put("STEP1_DB_CHECK", "PASSED - User found");
                response.put("userEmail", user.getEmail());
                response.put("userRole", user.getRole());
                response.put("storedPasswordHash", user.getPassword());

                // 2. Manual password check
                boolean passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPassword());
                response.put("STEP2_PASSWORD_MATCH", passwordMatches);

                // 3. Try to load UserDetails
                try {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
                    response.put("STEP3_USERDETAILS_LOAD", "PASSED");
                    response.put("userDetailsUsername", userDetails.getUsername());
                    response.put("userDetailsPassword", userDetails.getPassword());
                    response.put("userDetailsAuthorities", userDetails.getAuthorities().toString());

                    // 4. Try manual authentication
                    try {
                        UsernamePasswordAuthenticationToken token =
                                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword());

                        Authentication auth = authenticationManager.authenticate(token);
                        response.put("STEP4_AUTH_MANAGER", "PASSED");
                        response.put("authPrincipal", auth.getPrincipal().toString());
                        response.put("authAuthorities", auth.getAuthorities().toString());

                    } catch (Exception e) {
                        response.put("STEP4_AUTH_MANAGER", "FAILED: " + e.getClass().getSimpleName());
                        response.put("authManagerError", e.getMessage());
                    }

                } catch (Exception e) {
                    response.put("STEP3_USERDETAILS_LOAD", "FAILED: " + e.getClass().getSimpleName());
                    response.put("userDetailsError", e.getMessage());
                }

            } else {
                response.put("STEP1_DB_CHECK", "FAILED - User not found");
            }

        } catch (Exception e) {
            response.put("ERROR", e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<?>> signup(@Valid @RequestBody Customer customer) {
        AdminSettings adminSettings = adminSettingsRepository.findById("admin-config")
                .orElseGet(() -> {
                    AdminSettings newSettings = new AdminSettings();
                    newSettings.setId("admin-config");
                    return adminSettingsRepository.save(newSettings);
                });

        boolean isAdmin = adminSettings.getAdminEmails().contains(customer.getEmail());
        if(isAdmin) {
            User admin = new User();
            admin.setEmail(customer.getEmail());
            admin.setPassword(passwordEncoder.encode(customer.getPassword()));
            admin.setUsername(customer.getUsername());
            admin.setPhoneNumber(customer.getPhoneNumber());
            admin.setRole("ADMIN");
            admin.setActive(true);

            User savedAdmin = userService.createUser(admin);
            return ResponseEntity.ok(
                    ApiResponse.success("Admin account created successfully", savedAdmin)
            );
        } else {
            customer.setRole("CUSTOMER");
            Customer savedCustomer = userService.createCustomer(customer);
            return new ResponseEntity<>(
                    ApiResponse.success("Registration successful! Please login.", savedCustomer), HttpStatus.CREATED
            );
        }
    }
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request){
        try {
            System.out.println("========== LOGIN ATTEMPT ==========");
            System.out.println("Email: " + request.getUsername());

            // Authenticate
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            System.out.println("Authentication successful!");
            System.out.println("Authentication class: " + authentication.getClass().getName());
            System.out.println("Principal class: " + authentication.getPrincipal().getClass().getName());

            // Get UserDetails from authentication
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            System.out.println("UserDetails username: " + userDetails.getUsername());
            System.out.println("UserDetails authorities: " + userDetails.getAuthorities());

            // Generate token
            String jwt = jwtUtil.generateToken(userDetails);
            System.out.println("JWT generated successfully");

            // Extract role from authorities
            String role = userDetails.getAuthorities().iterator().next().getAuthority();
            // Remove "ROLE_" prefix if present for response
            if (role.startsWith("ROLE_")) {
                role = role.substring(5); // Remove "ROLE_"
            }

            AuthResponse response = new AuthResponse(jwt, userDetails.getUsername(), role);
            return ResponseEntity.ok(ApiResponse.success("Login successful", response));

        } catch (Exception e) {
            System.out.println("========== LOGIN FAILED ==========");
            System.out.println("Error type: " + e.getClass().getName());
            System.out.println("Error message: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Invalid username or password"));
        }
    }
}
