package com.app.features.payments.provider;

import com.app.common.BusinessException;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.payments.config.PayOSProperties;
import com.app.features.payments.entity.Payment;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.webhooks.WebhookData;

@Component
@Slf4j
public class PayOSPaymentProvider implements PaymentProvider {
    private final PayOSProperties properties;

    public PayOSPaymentProvider(PayOSProperties properties) { this.properties = properties; }

    @Override public String providerCode() { return "PAYOS"; }

    @Override public PaymentProviderDto.CreateResult createPayment(MarketOrder order, Payment payment) {
        requireConfigured();
        long amount = exactVnd(payment.getAmount());
        long expiry = Instant.now().plusSeconds(properties.getLinkTtlSeconds()).getEpochSecond();
        String returnUrl = callbackUrl(properties.getReturnUrl(), order.getId());
        String cancelUrl = callbackUrl(properties.getCancelUrl(), order.getId());
        CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
            .orderCode(payment.getProviderOrderCode())
            .amount(amount)
            .description("CM " + order.getId())
            .returnUrl(returnUrl)
            .cancelUrl(cancelUrl)
            .buyerName(order.getFullName())
            .buyerEmail(order.getUser().getEmail())
            .buyerPhone(order.getPhone())
            .buyerAddress(order.getAddress())
            .expiredAt(expiry)
            .build();
        try {
            CreatePaymentLinkResponse response = client().paymentRequests().create(request);
            return new PaymentProviderDto.CreateResult(response.getOrderCode(), response.getPaymentLinkId(),
                response.getCheckoutUrl(), response.getQrCode(), response.getAmount(),
                response.getStatus() == null ? "PENDING" : response.getStatus().name(),
                response.getExpiredAt() == null ? Instant.ofEpochSecond(expiry) : Instant.ofEpochSecond(response.getExpiredAt()));
        } catch (RuntimeException ex) {
            log.error("payOS create payment failed for order {}: {}", order.getId(), ex.getMessage());
            throw BusinessException.bad("PAYOS_API_ERROR", "Không thể tạo liên kết payOS. Vui lòng thử lại sau");
        }
    }

    @Override public PaymentProviderDto.StatusResult getPaymentStatus(Payment payment) {
        requireConfigured();
        try {
            PaymentLink response = client().paymentRequests().get(payment.getProviderOrderCode());
            return statusResult(response);
        } catch (RuntimeException ex) {
            log.error("payOS status lookup failed for payment {}: {}", payment.getId(), ex.getMessage());
            throw BusinessException.bad("PAYOS_API_ERROR", "Không thể kiểm tra trạng thái payOS");
        }
    }

    @Override public PaymentProviderDto.StatusResult cancelPayment(Payment payment, String reason) {
        requireConfigured();
        try {
            PaymentLink response = client().paymentRequests().cancel(payment.getProviderOrderCode(), reason);
            return statusResult(response);
        } catch (RuntimeException ex) {
            log.error("payOS cancel failed for payment {}: {}", payment.getId(), ex.getMessage());
            throw BusinessException.bad("PAYOS_CANCEL_ERROR", "Không thể hủy liên kết payOS. Vui lòng thử lại");
        }
    }

    private PaymentProviderDto.StatusResult statusResult(PaymentLink response) {
        String transactionId = null;
        if (response.getTransactions() != null && !response.getTransactions().isEmpty()) {
            transactionId = response.getTransactions().get(response.getTransactions().size() - 1).getReference();
        }
        return new PaymentProviderDto.StatusResult(response.getOrderCode(), response.getAmount(),
            response.getAmountPaid(), response.getStatus() == null ? "PENDING" : response.getStatus().name(),
            response.getId(), transactionId);
    }

    @Override public PaymentProviderDto.WebhookResult verifyWebhook(Object payload) {
        requireConfigured();
        try {
            WebhookData data = client().webhooks().verify(payload);
            return new PaymentProviderDto.WebhookResult(data.getOrderCode(), data.getAmount(), data.getPaymentLinkId(),
                data.getReference(), data.getCode(), data.getTransactionDateTime());
        } catch (RuntimeException ex) {
            log.error("Invalid payOS webhook: {}", ex.getMessage());
            throw BusinessException.bad("INVALID_PAYOS_WEBHOOK", "Webhook payOS không hợp lệ");
        }
    }

    private PayOS client() { return new PayOS(properties.getClientId(), properties.getApiKey(), properties.getChecksumKey()); }

    private void requireConfigured() {
        if (!properties.configured()) throw BusinessException.bad("PAYOS_NOT_CONFIGURED", "Chưa cấu hình thông tin payOS");
    }

    private long exactVnd(BigDecimal amount) {
        try { return amount.stripTrailingZeros().longValueExact(); }
        catch (ArithmeticException ex) { throw BusinessException.bad("INVALID_PAYMENT_AMOUNT", "Số tiền thanh toán phải là số nguyên VND"); }
    }

    private String callbackUrl(String baseUrl, Long orderId) {
        return UriComponentsBuilder.fromUriString(baseUrl).replaceQueryParam("orderId", orderId).build().toUriString();
    }
}