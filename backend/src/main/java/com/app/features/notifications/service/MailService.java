package com.app.features.notifications.service;

import com.app.features.notifications.dto.MailEventDto.OrderPlacedMailEvent;
import com.app.features.notifications.dto.MailEventDto.PaymentSucceededMailEvent;

public interface MailService {
    void sendVerificationOtp(String email, String fullName, String otp, int ttlMinutes);
    void sendPasswordResetLink(String email, String fullName, String resetUrl, int ttlMinutes);
    void sendOrderConfirmation(OrderPlacedMailEvent event);
    void sendPaymentConfirmation(PaymentSucceededMailEvent event);
    void sendNotice(com.app.features.notifications.dto.MailEventDto.NoticeMailEvent event);
}