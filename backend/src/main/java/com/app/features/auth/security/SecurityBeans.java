package com.app.features.auth.security;

import com.app.features.auth.repository.*;
import java.util.LinkedHashSet;
import org.springframework.context.annotation.*;
import org.springframework.security.core.userdetails.*;

@Configuration
public class SecurityBeans {
    @Bean UserDetailsService userDetailsService(UserRepository users,UserRoleAssignmentRepository assignments) {
        return email -> users.findByEmailIgnoreCase(email).filter(com.app.features.auth.entity.UserAccount::isEnabled)
            .map(user -> {
                LinkedHashSet<String> roles=new LinkedHashSet<>();
                assignments.findByUserId(user.getId()).forEach(a->roles.add(a.getRole().getName().toUpperCase()));
                roles.add(user.getRole().toUpperCase());
                return User.withUsername(user.getEmail()).password(user.getPasswordHash()).roles(roles.toArray(String[]::new)).build();
            }).orElseThrow(()->new UsernameNotFoundException("Account not found"));
    }
}
