package com.app.features.auth.controller;

import com.app.common.ApiResponse;
import com.app.features.auth.dto.AuthControllerDto.*;
import com.app.features.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfAuthenticationStrategy;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;
    public AuthController(AuthService service) { this.service = service; }

    @PostMapping("/register")
    public ApiResponse<AuthResult> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest servletRequest, HttpServletResponse response) {
        ApiResponse<AuthResult> result = service.register(request);
        return result.data().emailVerificationRequired() ? result : signIn(result, servletRequest, response);
    }
    @PostMapping("/login")
    public ApiResponse<AuthResult> login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest, HttpServletResponse response) { return signIn(service.login(request), servletRequest, response); }
    @PostMapping("/email/verify")
    public ApiResponse<AuthResult> verify(@Valid @RequestBody VerifyEmailRequest request, HttpServletRequest servletRequest, HttpServletResponse response) { return signIn(service.verifyEmail(request), servletRequest, response); }
    @PostMapping("/email/resend") public ApiResponse<Void> resend(@Valid @RequestBody EmailRequest request) { return service.resendVerificationOtp(request); }
    @PostMapping("/password/forgot") public ApiResponse<Void> forgot(@Valid @RequestBody EmailRequest request) { return service.forgotPassword(request); }
    @PostMapping("/password/reset") public ApiResponse<Void> reset(@Valid @RequestBody ResetPasswordRequest request) { return service.resetPassword(request); }
    @GetMapping("/csrf") public ApiResponse<CsrfToken> csrf(CsrfToken token) { return ApiResponse.ok(token); }
    @GetMapping("/me") public ApiResponse<UserView> me() { return service.me(); }

    private ApiResponse<AuthResult> signIn(ApiResponse<AuthResult> result, HttpServletRequest request, HttpServletResponse response) {
        if (request.getSession(false) != null) request.changeSessionId();
        UserView user = result.data().user();
        var authentication = new UsernamePasswordAuthenticationToken(user.email(), null, List.of(new SimpleGrantedAuthority("ROLE_" + user.role())));
        var context = SecurityContextHolder.createEmptyContext(); context.setAuthentication(authentication); SecurityContextHolder.setContext(context);
        new CsrfAuthenticationStrategy(new HttpSessionCsrfTokenRepository()).onAuthentication(authentication, request, response);
        new HttpSessionSecurityContextRepository().saveContext(context, request, response);
        return result;
    }
}