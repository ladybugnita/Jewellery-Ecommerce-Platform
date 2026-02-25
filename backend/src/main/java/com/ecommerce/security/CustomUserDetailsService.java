package com.ecommerce.security;

import com.ecommerce.model.AdminSettings;
import com.ecommerce.model.Customer;
import com.ecommerce.repository.CustomerRepository;
import com.ecommerce.model.User;
import com.ecommerce.repository.AdminSettingsRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final AdminSettingsRepository adminSettingsRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.info("Attempting to load user by email: {}", email);

        AdminSettings adminSettings = adminSettingsRepository.findById("admin-config")
                .orElse(new AdminSettings());

        boolean isAdminEmail = adminSettings.getAdminEmails().contains(email);
        log.info("Is admin email? {}", isAdminEmail);

        if (isAdminEmail) {
            Optional<User> adminOpt = userRepository.findByEmail(email);

            if (adminOpt.isPresent()) {
                User admin = adminOpt.get();
                log.info("Admin found in users collection with role: {}", admin.getRole());
                return new org.springframework.security.core.userdetails.User(
                        admin.getEmail(),
                        admin.getPassword(),
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
            } else {
                log.error("Admin email configured but user not found in users collection: {}", email);
                throw new UsernameNotFoundException("Admin email configured but user not found: " + email);
            }
        } else {
            Optional<Customer> customerOpt = customerRepository.findByEmail(email);

            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();
                log.info("Customer found in customers collection with role: {}", customer.getRole());
                return new org.springframework.security.core.userdetails.User(
                        customer.getEmail(),
                        customer.getPassword(),
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
                );
            } else {
                Optional<User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    log.info("User found in users collection with role: {}", user.getRole());

                    return new org.springframework.security.core.userdetails.User(
                            user.getEmail(),
                            user.getPassword(),
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
                    );
                }
            }
        }
        log.error("User not found with email: {}", email);
        throw new UsernameNotFoundException("User not found with email: " + email);
    }
}
