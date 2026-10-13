package com.app.features.shipping.controller;
import com.app.common.ApiResponse;
import com.app.features.shipping.dto.ShippingDto.*;
import com.app.features.shipping.service.ShippingService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController public class ShippingController {private final ShippingService service;public ShippingController(ShippingService service){this.service=service;}
 @PostMapping("/api/checkout/shipping-quote") @PreAuthorize("hasRole('USER')") public ApiResponse<QuoteView> quote(@RequestBody QuoteRequest r){return ApiResponse.ok(service.quote(r.address()));}
 @GetMapping("/api/checkout/shipping-zones") @PreAuthorize("hasRole('USER')") public ApiResponse<List<ZoneView>> active(){return ApiResponse.ok(service.listActive());}
 @GetMapping({"/api/admin/shipping-zones","/api/manager/shipping-zones"}) @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") public ApiResponse<List<ZoneView>> list(){return ApiResponse.ok(service.list());}
 @PostMapping("/api/admin/shipping-zones") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<ZoneView> create(@RequestBody ZoneRequest r){return ApiResponse.ok(service.create(r));}
 @PutMapping("/api/admin/shipping-zones/{id}") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<ZoneView> update(@PathVariable Long id,@RequestBody ZoneRequest r){return ApiResponse.ok(service.update(id,r));}
 @DeleteMapping("/api/admin/shipping-zones/{id}") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<Void> delete(@PathVariable Long id){service.delete(id);return ApiResponse.ok(null);}}
