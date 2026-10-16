package com.app.features.auth.service;

import com.app.common.ApiResponse;
import com.app.features.auth.dto.AuthControllerDto.*;
import jakarta.validation.Valid;

public interface AuthService {
    ApiResponse<AuthResult> register(@Valid RegisterRequest request);
    ApiResponse<AuthResult> login(@Valid LoginRequest request);
    ApiResponse<AuthResult> loginWithGoogle(@Valid GoogleAuthRequest request);
    ApiResponse<AuthResult> verifyEmail(@Valid VerifyEmailRequest request);
    ApiResponse<Void> resendVerificationOtp(@Valid EmailRequest request);
    ApiResponse<Void> forgotPassword(@Valid EmailRequest request);
    ApiResponse<Void> resetPassword(@Valid ResetPasswordRequest request);
    ApiResponse<UserView> me();
}