package com.app.features.notifications.serviceimpl;

import com.app.features.notifications.dto.MailEventDto.OrderPlacedMailEvent;
import com.app.features.notifications.dto.MailEventDto.PaymentSucceededMailEvent;
import com.app.features.notifications.service.MailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class TransactionalMailListener {
    private static final Logger log = LoggerFactory.getLogger(TransactionalMailListener.class);
    private final MailService mail;
    public TransactionalMailListener(MailService mail) { this.mail = mail; }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void orderPlaced(OrderPlacedMailEvent event) {
        try { mail.sendOrderConfirmation(event); }
        catch (RuntimeException ex) { log.error("Không thể gửi email xác nhận đơn {}", event.orderCode(), ex); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void paymentSucceeded(PaymentSucceededMailEvent event) {
        try { mail.sendPaymentConfirmation(event); }
        catch (RuntimeException ex) { log.error("Không thể gửi email thanh toán đơn {}", event.orderCode(), ex); }
    }
}