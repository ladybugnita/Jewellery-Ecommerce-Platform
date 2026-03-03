package com.ecommerce.security;

import com.ecommerce.model.Customer;
import com.ecommerce.model.User;
import com.ecommerce.repository.CustomerRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.info("========== LOAD USER BY USERNAME ==========");
        log.info("Searching for identifier: {}", username);

        User user = userRepository.findByEmail(username).orElse(null);
        if (user != null) {
            log.info("Found user in users collection with role: {}", user.getRole());
            return org.springframework.security.core.userdetails.User.builder()
                    .username(username)
                    .password(user.getPassword())
                    .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole())))
                    .accountExpired(false)
                    .accountLocked(false)
                    .credentialsExpired(false)
                    .disabled(!user.getActive())
                    .build();
        }

        Customer customer = customerRepository.findByEmail(username).orElse(null);
        if (customer != null) {
            log.info("Found customer in customers collection with role: CUSTOMER");
            return org.springframework.security.core.userdetails.User.builder()
                    .username(username)
                    .password(customer.getPassword())
                    .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_CUSTOMER")))
                    .accountExpired(false)
                    .accountLocked(false)
                    .credentialsExpired(false)
                    .disabled(!customer.getActive())
                    .build();
        }

        log.error("User not found with identifier: {}", username);
        throw new UsernameNotFoundException("User not found: " + username);
    }
}