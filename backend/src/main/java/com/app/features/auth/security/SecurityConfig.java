package com.app.features.auth.security;

import com.app.common.GlobalExceptionHandler.ErrorBody;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.web.cors.*;

@Configuration @EnableMethodSecurity
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}
    @Bean CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.allowed-origins}") String origins){CorsConfiguration c=new CorsConfiguration();c.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).toList());c.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));c.setAllowedHeaders(List.of("Content-Type","X-CSRF-TOKEN"));c.setAllowCredentials(true);UrlBasedCorsConfigurationSource s=new UrlBasedCorsConfigurationSource();s.registerCorsConfiguration("/**",c);return s;}
    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http,com.app.features.auth.repository.UserRepository users,AccountRoles roles,ObjectMapper json)throws Exception{
        return http.csrf(csrf->csrf.ignoringRequestMatchers("/api/payments/payos/webhook")).cors(cors->{}).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .exceptionHandling(errors->errors
                .authenticationEntryPoint((request,response,exception)->writeError(response,json,HttpStatus.UNAUTHORIZED,"AUTHENTICATION_REQUIRED","Vui lòng đăng nhập để tiếp tục"))
                .accessDeniedHandler((request,response,exception)->{
                    if(exception instanceof CsrfException) writeError(response,json,HttpStatus.FORBIDDEN,"CSRF_INVALID","Phiên bảo mật không hợp lệ, vui lòng thử lại");
                    else writeError(response,json,HttpStatus.FORBIDDEN,"FORBIDDEN","Bạn không có quyền truy cập");
                }))
            .authorizeHttpRequests(auth->auth
                .requestMatchers("/","/api/auth/csrf","/api/auth/register","/api/auth/login","/api/auth/email/**","/api/auth/password/**","/api/payments/payos/webhook","/swagger-ui/**","/swagger-ui.html","/v3/api-docs/**","/actuator/health").permitAll()
                .requestMatchers(HttpMethod.GET,"/api/products/**","/api/categories","/api/suppliers","/api/suppliers/*","/api/trace/**").permitAll()
                .requestMatchers("/api/supplier-applications/**").hasRole("USER")
                .requestMatchers("/api/partner/**").hasRole("PARTNER")
                .requestMatchers("/api/manager/**").hasAnyRole("MANAGER","ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .addFilterAfter(new AccountStateFilter(users,roles),org.springframework.security.web.context.SecurityContextHolderFilter.class)
            .logout(logout->logout.logoutUrl("/api/auth/logout").logoutSuccessHandler((request,response,authentication)->response.setStatus(204))).build();
    }

    private static void writeError(jakarta.servlet.http.HttpServletResponse response,ObjectMapper json,HttpStatus status,String code,String message)throws java.io.IOException{
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(java.nio.charset.StandardCharsets.UTF_8.name());
        json.writeValue(response.getOutputStream(),new ErrorBody(false,code,message,List.of()));
    }
}
