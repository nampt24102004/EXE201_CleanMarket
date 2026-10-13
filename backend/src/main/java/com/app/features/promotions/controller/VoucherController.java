package com.app.features.promotions.controller;
import com.app.common.ApiResponse;import com.app.features.promotions.dto.VoucherDto.*;import com.app.features.promotions.service.VoucherService;import java.util.List;import org.springframework.security.access.prepost.PreAuthorize;import org.springframework.web.bind.annotation.*;
@RestController public class VoucherController {private final VoucherService service;public VoucherController(VoucherService service){this.service=service;}
 @PostMapping("/api/checkout/quote") @PreAuthorize("hasRole('USER')") public ApiResponse<CheckoutQuote> quote(@RequestBody CheckoutQuoteRequest r){return ApiResponse.ok(service.quote(r));}
 @GetMapping("/api/partner/vouchers") @PreAuthorize("hasRole('PARTNER')") public ApiResponse<List<VoucherView>> partner(){return ApiResponse.ok(service.minePartner());}
 @PostMapping("/api/partner/vouchers") @PreAuthorize("hasRole('PARTNER')") public ApiResponse<VoucherView> createPartner(@RequestBody VoucherRequest r){return ApiResponse.ok(service.createPartner(r));}
 @PutMapping("/api/partner/vouchers/{id}") @PreAuthorize("hasRole('PARTNER')") public ApiResponse<VoucherView> updatePartner(@PathVariable Long id,@RequestBody VoucherRequest r){return ApiResponse.ok(service.updatePartner(id,r));}
 @PutMapping("/api/partner/vouchers/{id}/status") @PreAuthorize("hasRole('PARTNER')") public ApiResponse<VoucherView> statusPartner(@PathVariable Long id,@RequestBody StatusRequest r){return ApiResponse.ok(service.statusPartner(id,r.status()));}
 @DeleteMapping("/api/partner/vouchers/{id}") @PreAuthorize("hasRole('PARTNER')") public ApiResponse<VoucherView> deletePartner(@PathVariable Long id){return ApiResponse.ok(service.statusPartner(id,"INACTIVE"));}
 @GetMapping("/api/manager/vouchers") @PreAuthorize("hasAnyRole('MANAGER','ADMIN')") public ApiResponse<List<VoucherView>> platform(){return ApiResponse.ok(service.platform());}
 @PostMapping("/api/manager/vouchers") @PreAuthorize("hasAnyRole('MANAGER','ADMIN')") public ApiResponse<VoucherView> createPlatform(@RequestBody VoucherRequest r){return ApiResponse.ok(service.createPlatform(r));}
 @PutMapping("/api/manager/vouchers/{id}") @PreAuthorize("hasAnyRole('MANAGER','ADMIN')") public ApiResponse<VoucherView> updatePlatform(@PathVariable Long id,@RequestBody VoucherRequest r){return ApiResponse.ok(service.updatePlatform(id,r));}
 @PutMapping("/api/manager/vouchers/{id}/status") @PreAuthorize("hasAnyRole('MANAGER','ADMIN')") public ApiResponse<VoucherView> statusPlatform(@PathVariable Long id,@RequestBody StatusRequest r){return ApiResponse.ok(service.statusPlatform(id,r.status()));}
 @DeleteMapping("/api/manager/vouchers/{id}") @PreAuthorize("hasAnyRole('MANAGER','ADMIN')") public ApiResponse<VoucherView> deletePlatform(@PathVariable Long id){return ApiResponse.ok(service.statusPlatform(id,"INACTIVE"));}
 public record StatusRequest(String status){}
}
