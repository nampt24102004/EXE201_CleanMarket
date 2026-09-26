package com.app.features.payments.service;

import com.app.features.payments.dto.PaymentServiceDto.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

public interface PaymentService {
    PaymentUrl create(Long orderId, HttpServletRequest request);
    PaymentStatus status(String orderCode);
    IpnResult ipn(Map<String, String> params);
    String returnOrderCode(Map<String, String> params);
}
