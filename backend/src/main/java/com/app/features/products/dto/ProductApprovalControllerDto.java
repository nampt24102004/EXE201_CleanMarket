package com.app.features.products.dto;

import com.app.features.products.dto.PartnerProductControllerDto.CertificateView;
import com.app.features.products.dto.PartnerProductControllerDto.ImageView;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.List;

public final class ProductApprovalControllerDto {
    private ProductApprovalControllerDto(){}
    public record ReviewView(Long id,String name,String supplierName,String approvalStatus,String status,String certificateNo,
        BigDecimal price,BigDecimal stock,String unit,String origin,String description,String rejectionReason,
        List<ImageView> images,List<CertificateView> certificates){}
    public record RejectRequest(@NotBlank(message="Vui lòng nhập lý do từ chối") String reason){}
}
