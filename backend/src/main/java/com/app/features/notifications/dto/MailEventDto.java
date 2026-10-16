package com.app.features.notifications.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class MailEventDto {
    private MailEventDto() { }
    public record OrderItemMail(String name, BigDecimal quantity, String unit, BigDecimal unitPrice, BigDecimal totalAmount) { }
    public record OrderPlacedMailEvent(String email, String customerName, String orderCode, String paymentMethod, BigDecimal totalAmount, String address, List<OrderItemMail> items) { }
    public record PaymentSucceededMailEvent(String email, String customerName, String orderCode, String transactionNo, BigDecimal amount, Instant paidAt, String paymentMethod, String address, List<OrderItemMail> items) { }
    /** Generic notice (review results, expiry warnings). path is relative to the frontend, e.g. "/partner". */
    public record NoticeMailEvent(String email, String fullName, String title, String message, String path) { }
}