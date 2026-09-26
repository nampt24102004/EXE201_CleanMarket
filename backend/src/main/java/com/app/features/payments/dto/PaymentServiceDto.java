package com.app.features.payments.dto;

import com.app.common.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

public final class PaymentServiceDto {
    private PaymentServiceDto() { }
    public record PaymentUrl(String paymentUrl, String txnRef) { }
    public record PaymentStatus(String orderCode, String provider, String status, BigDecimal amount) { }
    public record IpnResult(String RspCode, String Message) { }
}
