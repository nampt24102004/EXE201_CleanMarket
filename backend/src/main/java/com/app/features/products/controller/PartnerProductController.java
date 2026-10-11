package com.app.features.products.controller;

import com.app.common.ApiResponse;
import com.app.features.products.dto.PartnerProductControllerDto.*;
import com.app.features.products.service.PartnerProductService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController @RequestMapping("/api/partner/products")
public class PartnerProductController {
    private final PartnerProductService service;
    public PartnerProductController(PartnerProductService service){this.service=service;}
    @GetMapping public ApiResponse<List<ProductView>> mine(){return service.mine();}
    @GetMapping("/{id}") public ApiResponse<ProductView> get(@PathVariable Long id){return service.get(id);}
    @PostMapping public ApiResponse<ProductView> create(@Valid @RequestBody ProductRequest request){return service.create(request);}
    @PutMapping("/{id}") public ApiResponse<ProductView> update(@PathVariable Long id,@Valid @RequestBody ProductRequest request){return service.update(id,request);}
    @PostMapping(value="/{id}/images",consumes="multipart/form-data") public ApiResponse<List<ImageView>> images(@PathVariable Long id,@RequestPart("files") List<MultipartFile> files){return service.uploadImages(id,files);}
    @PostMapping(value="/{id}/certificates",consumes="multipart/form-data")
    public ApiResponse<CertificateView> certificate(@PathVariable Long id,@RequestParam String certificateType,@RequestParam String certificateNumber,
        @RequestParam String issuer,@RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate issuedDate,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate expiryDate,@RequestPart MultipartFile file){
        return service.uploadCertificate(id,certificateType,certificateNumber,issuer,issuedDate,expiryDate,file);
    }
    @PostMapping("/{id}/submit") public ApiResponse<ProductView> submit(@PathVariable Long id){return service.submit(id);}
}
