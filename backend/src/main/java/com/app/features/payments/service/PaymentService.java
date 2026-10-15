package com.app.features.payments.service;

import com.app.features.payments.dto.PaymentServiceDto.*;
public interface PaymentService {
    PaymentStatus status(String orderCode);
}
