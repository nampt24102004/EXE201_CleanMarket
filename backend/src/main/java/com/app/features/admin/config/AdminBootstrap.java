package com.app.features.admin.config;

import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminBootstrap {
    @Bean CommandLineRunner bootstrapAdmin(UserRepository users, PasswordEncoder passwords, @Value("${BOOTSTRAP_ADMIN_EMAIL:}") String email, @Value("${BOOTSTRAP_ADMIN_PASSWORD:}") String password) {
        return args -> {
            if (email.isBlank() || password.isBlank() || users.existsByEmailIgnoreCase(email)) return;
            if (password.length() < 12) throw new IllegalStateException("BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters");
            UserAccount admin = new UserAccount(); admin.setEmail(email.trim().toLowerCase()); admin.setFullName("System Admin"); admin.setPasswordHash(passwords.encode(password)); admin.setRole("ADMIN"); users.save(admin);
        };
    }
}
