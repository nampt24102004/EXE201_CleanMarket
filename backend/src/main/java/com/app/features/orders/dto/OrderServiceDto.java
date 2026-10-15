package com.app.features.orders.dto;

import com.app.common.*;
import java.math.BigDecimal;
import java.util.*;

public final class OrderServiceDto {
    private OrderServiceDto() { }
    public record CheckoutRequest(String fullName, String phone, String address, String note, String paymentMethod, String platformVoucherCode, List<String> partnerVoucherCodes) { }
    public record OrderItemView(Long id, Long productId, String productName, BigDecimal unitPrice, String unit, BigDecimal quantity, BigDecimal totalAmount) { }
    public record SupplierOrderView(Long id, Long supplierId, String supplierName, String status, BigDecimal subtotal, BigDecimal discount, BigDecimal totalAmount, List<OrderItemView> items) { }
    public record OrderView(Long id, String orderCode, String status, String paymentMethod, BigDecimal subtotal, BigDecimal partnerDiscount, BigDecimal platformDiscount, BigDecimal shippingFee, BigDecimal shippingDiscount, BigDecimal totalAmount, String shippingZone, String fullName, String phone, String address, String note, java.time.Instant createdAt, List<SupplierOrderView> supplierOrders) { }
}
