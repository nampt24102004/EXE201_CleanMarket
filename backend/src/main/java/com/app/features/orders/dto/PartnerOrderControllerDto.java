package com.app.features.orders.dto;

import com.app.common.*;
import com.app.features.orders.dto.OrderServiceDto;
import java.util.*;

public final class PartnerOrderControllerDto {
    private PartnerOrderControllerDto() { }
    public record PartView(Long id, String orderCode, String status, java.math.BigDecimal totalAmount, List<OrderServiceDto.OrderItemView> items) { }
    public record StatusRequest(String status) { }
}
