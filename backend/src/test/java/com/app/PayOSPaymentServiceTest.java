package com.app;

import com.app.common.BusinessException;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.security.CurrentUser;
import com.app.features.notifications.dto.MailEventDto.PaymentSucceededMailEvent;
import com.app.features.notifications.repository.NotificationRepository;
import com.app.features.notifications.service.MailService;
import com.app.features.notifications.serviceimpl.TransactionalMailListener;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.orders.repository.OrderItemRepository;
import com.app.features.orders.repository.OrderRepository;
import com.app.features.orders.service.OrderStatusHistoryService;
import com.app.features.payments.entity.Payment;
import com.app.features.payments.provider.PayOSPaymentProvider;
import com.app.features.payments.provider.PaymentProviderDto;
import com.app.features.payments.repository.PaymentRepository;
import com.app.features.payments.repository.PaymentTransactionRepository;
import com.app.features.payments.serviceimpl.PayOSPaymentServiceImpl;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import vn.payos.model.webhooks.Webhook;
import com.app.features.promotions.service.VoucherService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayOSPaymentServiceTest {
    @Mock PaymentRepository payments;
    @Mock PaymentTransactionRepository transactions;
    @Mock OrderRepository orders;
    @Mock OrderItemRepository orderItems;
    @Mock NotificationRepository notifications;
    @Mock CurrentUser current;
    @Mock PayOSPaymentProvider provider;
    @Mock OrderStatusHistoryService history;
    @Mock ApplicationEventPublisher events;
    @Mock VoucherService voucherService;

    PayOSPaymentServiceImpl service;
    UserAccount owner;
    MarketOrder order;
    Payment payment;

    @BeforeEach void setup() {
        service = new PayOSPaymentServiceImpl(payments, transactions, orders, orderItems, notifications,
            current, provider, history, events, voucherService);
        owner = new UserAccount(); owner.setId(10L); owner.setEmail("buyer@example.test"); owner.setFullName("Buyer");
        order = new MarketOrder(); order.setId(25L); order.setUser(owner); order.setOrderCode("CM25");
        order.setPaymentMethod("PAYOS"); order.setStatus("PENDING_PAYMENT"); order.setTotalAmount(new BigDecimal("300000"));
        order.setFullName("Buyer"); order.setPhone("0912345678"); order.setAddress("Hà Nội");
        payment = new Payment(); payment.setId(55L); payment.setOrder(order); payment.setProvider("PAYOS");
        payment.setStatus("PENDING"); payment.setAmount(order.getTotalAmount()); payment.setProviderOrderCode(55L);
        lenient().when(current.get()).thenReturn(owner);
    }

    @Test void createPaymentSuccessfully() {
        stubCreate();
        var response = service.create(order.getId());
        assertEquals(55L, response.payOSOrderCode());
        assertEquals("https://pay.payos.vn/link", response.checkoutUrl());
        assertEquals("link-55", payment.getProviderPaymentLinkId());
        verify(provider).createPayment(order, payment);
    }

    @Test void createFailsWhenOrderDoesNotExist() {
        when(orders.lockById(999L)).thenReturn(Optional.empty());
        assertEquals("NOT_FOUND", assertThrows(BusinessException.class, () -> service.create(999L)).code());
        verifyNoInteractions(provider);
    }

    @Test void ownerCannotPayAnotherUsersOrder() {
        UserAccount stranger = new UserAccount(); stranger.setId(99L);
        when(orders.lockById(order.getId())).thenReturn(Optional.of(order));
        when(current.get()).thenReturn(stranger);
        assertEquals("FORBIDDEN", assertThrows(BusinessException.class, () -> service.create(order.getId())).code());
        verifyNoInteractions(provider);
    }

    @Test void paidPaymentCannotBeCreatedAgain() {
        when(orders.lockById(order.getId())).thenReturn(Optional.of(order));
        when(payments.existsByOrderIdAndStatus(order.getId(), "PAID")).thenReturn(true);
        assertEquals("PAYMENT_ALREADY_PAID", assertThrows(BusinessException.class, () -> service.create(order.getId())).code());
        verifyNoInteractions(provider);
    }

    @Test void pendingValidLinkIsReused() {
        payment.setCheckoutUrl("https://pay.payos.vn/reuse"); payment.setProviderPaymentLinkId("existing");
        payment.setExpiresAt(Instant.now().plusSeconds(600));
        when(orders.lockById(order.getId())).thenReturn(Optional.of(order));
        when(payments.findFirstByOrderIdAndProviderOrderByCreatedAtDesc(order.getId(), "PAYOS")).thenReturn(Optional.of(payment));
        var response = service.create(order.getId());
        assertEquals("https://pay.payos.vn/reuse", response.checkoutUrl());
        verifyNoInteractions(provider);
    }

    @Test void validWebhookMarksPaymentPaidAndOrderConfirmedAndPublishesEmailEvent() {
        stubSuccessfulWebhook("TXN-1");
        var response = service.handleWebhook(successWebhook());
        assertTrue(response.success());
        assertEquals("PAID", payment.getStatus());
        assertEquals("CONFIRMED", order.getStatus());
        assertNotNull(payment.getPaidAt());
        verify(history).record(order, "CONFIRMED", null, "payOS webhook đã xác minh");
        verify(events).publishEvent(isA(PaymentSucceededMailEvent.class));
        verify(notifications).save(any());
    }

    @Test void invalidWebhookSignatureDoesNotChangePayment() {
        when(provider.verifyWebhook(any())).thenThrow(BusinessException.bad("INVALID_PAYOS_WEBHOOK", "invalid"));
        assertEquals("INVALID_PAYOS_WEBHOOK", assertThrows(BusinessException.class,
            () -> service.handleWebhook(successWebhook())).code());
        assertEquals("PENDING", payment.getStatus());
        verify(payments, never()).lockByProviderOrderCode(anyLong());
        verifyNoInteractions(events);
    }

    @Test void amountMismatchDoesNotConfirmOrder() {
        when(provider.verifyWebhook(any())).thenReturn(webhookResult(55L, 299999L, "TXN-2"));
        when(payments.lockByProviderOrderCode(55L)).thenReturn(Optional.of(payment));
        assertEquals("PAYMENT_AMOUNT_MISMATCH", assertThrows(BusinessException.class,
            () -> service.handleWebhook(successWebhook())).code());
        assertEquals("PENDING", payment.getStatus());
        assertEquals("PENDING_PAYMENT", order.getStatus());
        verifyNoInteractions(events);
    }

    @Test void duplicateWebhookDoesNotCreateTransactionOrSecondEmail() {
        payment.setStatus("PAID"); payment.setPaidAt(Instant.now()); order.setStatus("CONFIRMED");
        when(provider.verifyWebhook(any())).thenReturn(webhookResult(55L, 300000L, "TXN-1"));
        when(payments.lockByProviderOrderCode(55L)).thenReturn(Optional.of(payment));
        var response = service.handleWebhook(successWebhook());
        assertTrue(response.success());
        verify(transactions, never()).save(any());
        verifyNoInteractions(events, notifications);
    }

    @Test void failedWebhookDoesNotConfirmOrderOrSendEmail() {
        Webhook failed = successWebhook(); failed.setSuccess(false);
        when(provider.verifyWebhook(any())).thenReturn(new PaymentProviderDto.WebhookResult(55L, 300000L, "link-55", "TXN-3", "01", null));
        when(payments.lockByProviderOrderCode(55L)).thenReturn(Optional.of(payment));
        service.handleWebhook(failed);
        assertEquals("FAILED", payment.getStatus());
        assertEquals("PENDING_PAYMENT", order.getStatus());
        verifyNoInteractions(events);
    }

    @Test void trustedPayOSStatusReconciliationMarksPaymentPaid() {
        when(orders.findById(order.getId())).thenReturn(Optional.of(order));
        when(payments.findByOrderIdOrderByCreatedAtDesc(order.getId())).thenReturn(List.of(payment));
        when(payments.lockById(payment.getId())).thenReturn(Optional.of(payment));
        when(provider.getPaymentStatus(payment)).thenReturn(new PaymentProviderDto.StatusResult(55L, 300000L,
            300000L, "PAID", "link-55", "TXN-STATUS-1"));
        when(orderItems.findBySupplierOrderOrderId(order.getId())).thenReturn(List.of());

        var result = service.status(order.getId());

        assertEquals("PAID", result.paymentStatus());
        assertEquals("CONFIRMED", result.orderStatus());
        assertEquals("TXN-STATUS-1", payment.getProviderTransactionNo());
        verify(history).record(order, "CONFIRMED", null, "Đối soát API payOS");
        verify(events).publishEvent(isA(PaymentSucceededMailEvent.class));
    }

    @Test void cancelledPayOSStatusStopsPendingPayment() {
        when(orders.findById(order.getId())).thenReturn(Optional.of(order));
        when(payments.findByOrderIdOrderByCreatedAtDesc(order.getId())).thenReturn(List.of(payment));
        when(payments.lockById(payment.getId())).thenReturn(Optional.of(payment));
        when(provider.getPaymentStatus(payment)).thenReturn(new PaymentProviderDto.StatusResult(55L, 300000L,
            0L, "CANCELLED", "link-55", null));

        var result = service.status(order.getId());

        assertEquals("CANCELLED", result.paymentStatus());
        assertEquals("PENDING_PAYMENT", result.orderStatus());
        verifyNoInteractions(events);
    }

    @Test void emailFailureIsContainedAfterPaymentCommit() {
        MailService mail = mock(MailService.class);
        doThrow(new IllegalStateException("SMTP unavailable")).when(mail).sendPaymentConfirmation(any());
        TransactionalMailListener listener = new TransactionalMailListener(mail);
        PaymentSucceededMailEvent event = new PaymentSucceededMailEvent("buyer@example.test", "Buyer", "CM25",
            "TXN-1", new BigDecimal("300000"), Instant.now(), "payOS", "Hà Nội", List.of());
        assertDoesNotThrow(() -> listener.paymentSucceeded(event));
    }

    private void stubCreate() {
        when(orders.lockById(order.getId())).thenReturn(Optional.of(order));
        when(payments.findFirstByOrderIdAndProviderOrderByCreatedAtDesc(order.getId(), "PAYOS")).thenReturn(Optional.of(payment));
        when(payments.saveAndFlush(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(provider.createPayment(order, payment)).thenReturn(new PaymentProviderDto.CreateResult(55L, "link-55",
            "https://pay.payos.vn/link", "qr-data", 300000L, "PENDING", Instant.now().plusSeconds(900)));
    }

    private void stubSuccessfulWebhook(String transactionId) {
        payment.setProviderPaymentLinkId("link-55");
        when(provider.verifyWebhook(any())).thenReturn(webhookResult(55L, 300000L, transactionId));
        when(payments.lockByProviderOrderCode(55L)).thenReturn(Optional.of(payment));
        when(transactions.existsByProviderTransactionNo(transactionId)).thenReturn(false);
        when(orderItems.findBySupplierOrderOrderId(order.getId())).thenReturn(List.of());
    }

    private PaymentProviderDto.WebhookResult webhookResult(long orderCode, long amount, String transactionId) {
        return new PaymentProviderDto.WebhookResult(orderCode, amount, "link-55", transactionId, "00", "2026-09-25 10:00:00");
    }

    private Webhook successWebhook() {
        Webhook webhook = new Webhook(); webhook.setSuccess(true); webhook.setCode("00"); return webhook;
    }
}
