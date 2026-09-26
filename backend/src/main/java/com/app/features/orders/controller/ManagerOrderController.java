package com.app.features.orders.controller;

import com.app.common.ApiResponse;
import com.app.features.orders.dto.OrderServiceDto;
import com.app.features.orders.service.ManagerOrderService;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/manager/orders")
public class ManagerOrderController {
    private final ManagerOrderService service;
    public ManagerOrderController(ManagerOrderService service) { this.service = service; }
    @GetMapping @Transactional(readOnly = true)
    public ApiResponse<List<OrderServiceDto.OrderView>> list() { return service.list(); }
}
