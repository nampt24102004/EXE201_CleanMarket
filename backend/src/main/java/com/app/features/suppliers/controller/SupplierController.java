package com.app.features.suppliers.controller;

import com.app.common.ApiResponse;
import com.app.features.suppliers.dto.SupplierControllerDto.*;
import com.app.features.suppliers.service.SupplierService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class SupplierController {
    private final SupplierService service;
    public SupplierController(SupplierService service){this.service=service;}

    @PostMapping({"/api/supplier-applications","/api/suppliers/apply"}) @PreAuthorize("hasRole('USER')")
    public ApiResponse<SupplierView> apply(@Valid @RequestBody ApplicationRequest request){return service.apply(request);}
    @GetMapping({"/api/supplier-applications/me","/api/suppliers/my"}) @PreAuthorize("isAuthenticated()")
    public ApiResponse<SupplierView> mine(){return service.mine();}
    @PutMapping("/api/supplier-applications/me") @PreAuthorize("hasRole('USER')")
    public ApiResponse<SupplierView> update(@Valid @RequestBody ProfileRequest request){return service.updateApplication(request);}
    @PostMapping(value="/api/supplier-applications/me/documents",consumes="multipart/form-data") @PreAuthorize("hasRole('USER')")
    public ApiResponse<DocumentView> upload(@RequestParam String documentType,@RequestParam(required=false) String documentName,@RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate expiryDate,@RequestPart MultipartFile file){return service.uploadDocument(documentType,documentName,expiryDate,file);}
    @DeleteMapping("/api/supplier-applications/me/documents/{documentId}") @PreAuthorize("hasRole('USER')")
    public ApiResponse<SupplierView> deleteDocument(@PathVariable Long documentId){return service.deleteDocument(documentId);}
    @PostMapping("/api/supplier-applications/me/resubmit") @PreAuthorize("hasRole('USER')")
    public ApiResponse<SupplierView> resubmit(){return service.resubmit();}
    @PutMapping("/api/partner/supplier-profile") public ApiResponse<SupplierView> profile(@Valid @RequestBody ProfileRequest request){return service.updateProfile(request);}
    @PostMapping(value="/api/partner/supplier-profile/documents",consumes="multipart/form-data") @PreAuthorize("hasRole('PARTNER')")
    public ApiResponse<DocumentView> uploadPartnerDocument(@RequestParam String documentType,@RequestParam(required=false) String documentName,@RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate expiryDate,@RequestPart MultipartFile file){return service.uploadPartnerDocument(documentType,documentName,expiryDate,file);}
    @DeleteMapping("/api/partner/supplier-profile/documents/{documentId}") @PreAuthorize("hasRole('PARTNER')")
    public ApiResponse<SupplierView> deletePartnerDocument(@PathVariable Long documentId){return service.deleteDocument(documentId);}

    @GetMapping("/api/manager/suppliers") public ApiResponse<List<SupplierView>> list(@RequestParam(defaultValue="ALL") String status){return service.list(status);}
    @GetMapping("/api/manager/suppliers/pending") public ApiResponse<List<SupplierView>> pending(){return service.list("PENDING");}
    @GetMapping("/api/manager/suppliers/{id}") public ApiResponse<SupplierView> detail(@PathVariable Long id){return service.detail(id);}
    @PutMapping("/api/manager/suppliers/{id}/approve") public ApiResponse<SupplierView> approve(@PathVariable Long id){return service.approve(id);}
    @PutMapping("/api/manager/suppliers/{id}/reject") public ApiResponse<SupplierView> reject(@PathVariable Long id,@Valid @RequestBody DecisionRequest request){return service.reject(id,request);}
    @PutMapping("/api/manager/suppliers/{id}/suspend") public ApiResponse<SupplierView> suspend(@PathVariable Long id,@Valid @RequestBody DecisionRequest request){return service.suspend(id,request);}
    @PutMapping("/api/manager/suppliers/{id}/reactivate") public ApiResponse<SupplierView> reactivate(@PathVariable Long id){return service.reactivate(id);}
    @PutMapping("/api/manager/suppliers/{supplierId}/documents/{documentId}/approve")
    public ApiResponse<SupplierView> approveDocument(@PathVariable Long supplierId,@PathVariable Long documentId){return service.approveDocument(supplierId,documentId);}
    @PutMapping("/api/manager/suppliers/{supplierId}/documents/{documentId}/reject")
    public ApiResponse<SupplierView> rejectDocument(@PathVariable Long supplierId,@PathVariable Long documentId,@Valid @RequestBody DecisionRequest request){return service.rejectDocument(supplierId,documentId,request);}
}
