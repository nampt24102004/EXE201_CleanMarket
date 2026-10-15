package com.app.features.auth.security;

import com.app.features.auth.repository.*;
import org.springframework.context.annotation.*;
import org.springframework.security.core.userdetails.*;

@Configuration
public class SecurityBeans {
    @Bean UserDetailsService userDetailsService(UserRepository users,AccountRoles roles) {
        return email -> users.findByEmailIgnoreCase(email).filter(AccountRoles::active)
            .map(user -> User.withUsername(user.getEmail()).password(user.getPasswordHash()).roles(roles.of(user).toArray(String[]::new)).build())
            .orElseThrow(()->new UsernameNotFoundException("Account not found"));
    }
}
