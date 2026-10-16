package com.app.features.orders.controller;

import com.app.common.ApiResponse;
import com.app.common.PageResult;
import com.app.features.orders.dto.ManagerOrderDto.CancelRequest;
import com.app.features.orders.dto.ManagerOrderDto.DeliveredRequest;
import com.app.features.orders.dto.ManagerOrderDto.OrderDetail;
import com.app.features.orders.dto.OrderServiceDto;
import com.app.features.orders.service.ManagerOrderService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/manager/orders")
public class ManagerOrderController {
    private final ManagerOrderService service;
    public ManagerOrderController(ManagerOrderService service) { this.service = service; }
    @GetMapping
    public ApiResponse<PageResult<OrderServiceDto.OrderView>> list(@RequestParam(required = false) String status, @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Integer page, @RequestParam(required = false) Integer size) {
        return service.list(status, paymentMethod, q, from, to, page, size);
    }
    @GetMapping("/{id}") public ApiResponse<OrderDetail> detail(@PathVariable Long id) { return service.detail(id); }
    @PutMapping("/{id}/delivered") public ApiResponse<OrderServiceDto.OrderView> delivered(@PathVariable Long id, @Valid @RequestBody(required = false) DeliveredRequest request) {
        return service.confirmDelivered(id, request == null ? null : request.note());
    }
    @PutMapping("/{id}/cancel") public ApiResponse<OrderServiceDto.OrderView> cancel(@PathVariable Long id, @Valid @RequestBody CancelRequest request) { return service.cancel(id, request.reason()); }
}
