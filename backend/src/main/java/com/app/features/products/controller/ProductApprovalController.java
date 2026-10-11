package com.app.features.products.controller;

import com.app.common.ApiResponse;
import com.app.features.products.dto.ProductApprovalControllerDto.*;
import com.app.features.products.service.ProductApprovalService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/manager/products")
public class ProductApprovalController {
    private final ProductApprovalService service;
    public ProductApprovalController(ProductApprovalService service){this.service=service;}
    @GetMapping public ApiResponse<List<ReviewView>> list(@RequestParam(defaultValue="PENDING") String status){return service.list(status);}
    @GetMapping("/{id}") public ApiResponse<ReviewView> detail(@PathVariable Long id){return service.detail(id);}
    @PutMapping("/{id}/approve") public ApiResponse<ReviewView> approve(@PathVariable Long id){return service.approve(id);}
    @PutMapping("/{id}/reject") public ApiResponse<ReviewView> reject(@PathVariable Long id,@Valid @RequestBody RejectRequest request){return service.reject(id,request);}
    @PutMapping("/{productId}/certificates/{certificateId}/approve") public ApiResponse<ReviewView> approveCertificate(@PathVariable Long productId,@PathVariable Long certificateId){return service.approveCertificate(productId,certificateId);}
    @PutMapping("/{productId}/certificates/{certificateId}/reject") public ApiResponse<ReviewView> rejectCertificate(@PathVariable Long productId,@PathVariable Long certificateId,@Valid @RequestBody RejectRequest request){return service.rejectCertificate(productId,certificateId,request);}
}
