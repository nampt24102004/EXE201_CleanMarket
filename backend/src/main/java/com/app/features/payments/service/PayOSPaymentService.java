package com.app.features.payments.service;

import com.app.features.payments.dto.PayOSPaymentDto.CreateResponse;
import com.app.features.payments.dto.PayOSPaymentDto.StatusResponse;
import com.app.features.payments.dto.PayOSPaymentDto.WebhookResponse;
import vn.payos.model.webhooks.Webhook;

public interface PayOSPaymentService {
    CreateResponse create(Long orderId);
    StatusResponse status(Long orderId);
    StatusResponse reconcile(Long paymentId);
    WebhookResponse handleWebhook(Webhook webhook);
}