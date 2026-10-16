package com.app.features.orders.service;

import com.app.common.ApiResponse;
import com.app.common.PageResult;
import com.app.features.orders.dto.ManagerOrderDto.OrderDetail;
import com.app.features.orders.dto.OrderServiceDto;
import java.time.LocalDate;

public interface ManagerOrderService {
    ApiResponse<PageResult<OrderServiceDto.OrderView>> list(String status, String paymentMethod, String q, LocalDate from, LocalDate to, Integer page, Integer size);
    ApiResponse<OrderDetail> detail(Long id);
    ApiResponse<OrderServiceDto.OrderView> cancel(Long id, String reason);
    ApiResponse<OrderServiceDto.OrderView> confirmDelivered(Long id, String note);
    ApiResponse<java.util.List<com.app.features.orders.dto.ManagerOrderDto.AwaitingDelivery>> awaitingDelivery();
    ApiResponse<com.app.features.orders.dto.ManagerOrderDto.BulkDeliveredResult> confirmAllDelivered(String note);
}
