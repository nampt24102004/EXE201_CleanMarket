package com.app.features.orders.serviceimpl;

import com.app.common.ApiResponse;
import com.app.features.orders.dto.OrderServiceDto;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.orders.repository.OrderRepository;
import com.app.features.orders.service.ManagerOrderService;
import com.app.features.orders.service.OrderService;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service public class ManagerOrderServiceImpl implements ManagerOrderService {
    private final OrderRepository orders; private final OrderService service;
    public ManagerOrderServiceImpl(OrderRepository orders, OrderService service) { this.orders = orders; this.service = service; }
    @Transactional(readOnly = true) public ApiResponse<List<OrderServiceDto.OrderView>> list() { return ApiResponse.ok(orders.findAll().stream().sorted(Comparator.comparing(com.app.features.orders.entity.MarketOrder::getCreatedAt).reversed()).map(service::view).toList()); }
}
