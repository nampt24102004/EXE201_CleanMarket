package com.app.features.orders.controller;

import com.app.common.*;
import com.app.features.orders.dto.PartnerOrderControllerDto.PartView;
import com.app.features.orders.dto.PartnerOrderControllerDto.StatusRequest;
import com.app.features.orders.service.PartnerOrderService;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/partner/orders")
public class PartnerOrderController {
    private final PartnerOrderService service;
    public PartnerOrderController(PartnerOrderService service) { this.service = service; }
    @GetMapping @Transactional(readOnly = true)
    public ApiResponse<List<PartView>> mine() { return service.mine(); }
    @PutMapping("/{id}/status") @Transactional
    public ApiResponse<PartView> update(@PathVariable Long id, @RequestBody StatusRequest request) { return service.update(id, request); }
}
