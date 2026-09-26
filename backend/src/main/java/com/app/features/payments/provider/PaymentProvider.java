package com.app.features.payments.provider;

import com.app.features.orders.entity.MarketOrder;
import com.app.features.payments.entity.Payment;

public interface PaymentProvider {
    String providerCode();
    PaymentProviderDto.CreateResult createPayment(MarketOrder order, Payment payment);
    PaymentProviderDto.StatusResult getPaymentStatus(Payment payment);
    PaymentProviderDto.StatusResult cancelPayment(Payment payment, String reason);
    PaymentProviderDto.WebhookResult verifyWebhook(Object payload);
}