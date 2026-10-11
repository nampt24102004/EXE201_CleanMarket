package com.app.features.products.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class PartnerProductControllerDto {
    private PartnerProductControllerDto(){}
    public record ProductRequest(@NotBlank String name,String description,@NotNull @DecimalMin("0.01") BigDecimal price,
        @NotBlank String unit,@NotNull Long categoryId,String imageUrl,String certificateNo,
        @NotNull @DecimalMin("0") BigDecimal stock,@NotBlank String origin){}
    public record ImageView(Long id,String imageUrl,String originalFileName,int sortOrder){}
    public record CertificateView(Long id,String certificateType,String certificateNumber,String issuer,LocalDate issuedDate,
        LocalDate expiryDate,String fileUrl,String status,String rejectionReason){}
    public record ProductView(Long id,String name,BigDecimal price,String unit,String approvalStatus,String status,
        BigDecimal stock,String origin,String description,Long categoryId,String categoryName,String imageUrl,
        String rejectionReason,List<ImageView> images,List<CertificateView> certificates,Instant createdAt){}
}
