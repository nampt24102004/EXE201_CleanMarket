package com.app.features.orders.controller;

import com.app.common.ApiResponse;
import com.app.features.orders.dto.OrderServiceDto;
import com.app.features.orders.service.OrderService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/orders") @PreAuthorize("hasRole('USER')")
public class OrderController {
    private final OrderService service;
    public OrderController(OrderService service) { this.service = service; }
    @GetMapping public ApiResponse<List<OrderServiceDto.OrderView>> mine() { return ApiResponse.ok(service.mine()); }
    @PostMapping("/checkout") public ApiResponse<OrderServiceDto.OrderView> checkout(@RequestBody OrderServiceDto.CheckoutRequest request) { return ApiResponse.ok(service.checkout(request)); }
    @PostMapping("/{id}/cancel") public ApiResponse<OrderServiceDto.OrderView> cancel(@PathVariable Long id) { return ApiResponse.ok(service.cancel(id)); }
    @GetMapping("/{id}") public ApiResponse<OrderServiceDto.OrderView> detail(@PathVariable Long id) { return ApiResponse.ok(service.owned(id)); }
    @GetMapping("/code/{code}") public ApiResponse<OrderServiceDto.OrderView> detailByCode(@PathVariable String code) { return ApiResponse.ok(service.ownedByCode(code)); }
}