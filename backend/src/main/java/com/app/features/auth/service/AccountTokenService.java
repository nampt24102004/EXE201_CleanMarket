package com.app.features.auth.service;

import com.app.features.auth.entity.UserAccount;

public interface AccountTokenService {
    void sendVerificationOtp(UserAccount user);
    UserAccount verifyEmail(String email, String otp);
    void resendVerificationOtp(String email);
    void sendPasswordResetLink(String email);
    void resetPassword(String token, String newPassword);
}