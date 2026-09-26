package com.app.features.auth.security;

import com.app.features.auth.repository.UserRepository;
import org.springframework.context.annotation.*;
import org.springframework.security.core.userdetails.*;

@Configuration
public class SecurityBeans {
    @Bean UserDetailsService userDetailsService(UserRepository users) {
        return email -> users.findByEmailIgnoreCase(email).filter(com.app.features.auth.entity.UserAccount::isEnabled)
            .map(user -> User.withUsername(user.getEmail()).password(user.getPasswordHash()).roles(user.getRole()).build())
            .orElseThrow(() -> new UsernameNotFoundException("Account not found"));
    }
}
