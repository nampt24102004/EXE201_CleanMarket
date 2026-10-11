package com.app.features.payments.config;

import com.app.common.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PaymentAvailability {
    private final PayOSProperties payOS;
    private final String vnpayTmnCode;
    private final String vnpayHashSecret;

    public PaymentAvailability(PayOSProperties payOS,
            @Value("${app.vnpay.tmn-code:}") String vnpayTmnCode,
            @Value("${app.vnpay.hash-secret:}") String vnpayHashSecret) {
        this.payOS = payOS;
        this.vnpayTmnCode = vnpayTmnCode;
        this.vnpayHashSecret = vnpayHashSecret;
    }

    public boolean payOS() { return payOS.configured(); }
    public boolean vnpay() { return !vnpayTmnCode.isBlank() && !vnpayHashSecret.isBlank(); }

    public void requireConfigured(String method) {
        if ("PAYOS".equals(method) && !payOS())
            throw BusinessException.bad("PAYOS_NOT_CONFIGURED", "Thanh toán payOS hiện chưa khả dụng. Vui lòng chọn COD.");
        if ("VNPAY".equals(method) && !vnpay())
            throw BusinessException.bad("VNPAY_NOT_CONFIGURED", "Thanh toán VNPAY hiện chưa khả dụng. Vui lòng chọn COD.");
    }
}
