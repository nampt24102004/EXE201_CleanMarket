package com.app.features.orders.dto;

import com.app.common.*;
import com.app.features.orders.dto.OrderServiceDto;
import java.util.*;

public final class PartnerOrderControllerDto {
    private PartnerOrderControllerDto() { }
    /** paymentStatus is the latest payment attempt; recipient fields are what the supplier needs to deliver. */
    public record PartView(Long id, String orderCode, String status, java.math.BigDecimal totalAmount, List<OrderServiceDto.OrderItemView> items,
        String orderStatus, String paymentMethod, String paymentStatus, String recipientName, String phone, String address, String note, java.time.Instant createdAt) { }
    public record StatusRequest(String status) { }
}
