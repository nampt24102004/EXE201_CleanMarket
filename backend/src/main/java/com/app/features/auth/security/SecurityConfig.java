package com.app.features.auth.security;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;

@Configuration @EnableMethodSecurity
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}
    @Bean CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.allowed-origins}") String origins){CorsConfiguration c=new CorsConfiguration();c.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).toList());c.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));c.setAllowedHeaders(List.of("Content-Type","X-CSRF-TOKEN"));c.setAllowCredentials(true);UrlBasedCorsConfigurationSource s=new UrlBasedCorsConfigurationSource();s.registerCorsConfiguration("/**",c);return s;}
    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http,com.app.features.auth.repository.UserRepository users,AccountRoles roles)throws Exception{
        return http.csrf(csrf->csrf.ignoringRequestMatchers("/api/payments/payos/webhook")).cors(cors->{}).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .authorizeHttpRequests(auth->auth
                .requestMatchers("/","/api/auth/csrf","/api/auth/register","/api/auth/login","/api/auth/google","/api/auth/email/**","/api/auth/password/**","/api/payments/payos/webhook","/swagger-ui/**","/swagger-ui.html","/v3/api-docs/**","/actuator/health").permitAll()
                .requestMatchers(HttpMethod.GET,"/api/products/**","/api/categories","/api/suppliers","/api/suppliers/*","/api/trace/**","/api/files/**").permitAll()
                .requestMatchers("/api/supplier-applications/**").hasRole("USER")
                .requestMatchers("/api/partner/**").hasRole("PARTNER")
                .requestMatchers("/api/manager/**").hasAnyRole("MANAGER","ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .addFilterAfter(new AccountStateFilter(users,roles),org.springframework.security.web.context.SecurityContextHolderFilter.class)
            .logout(logout->logout.logoutUrl("/api/auth/logout").logoutSuccessHandler((request,response,authentication)->response.setStatus(204))).build();
    }
}
