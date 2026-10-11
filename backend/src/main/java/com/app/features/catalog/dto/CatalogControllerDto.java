package com.app.features.catalog.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class CatalogControllerDto {
    private CatalogControllerDto(){}
    public record CategoryView(Long id,String name){}
    public record SupplierView(Long id,String name,String location,String description,String verificationStatus){}
    public record BatchView(Long id,String batchCode,String traceCode,String farmName,String origin,LocalDate harvestDate,LocalDate packagingDate,LocalDate expiryDate,String certificateNo,String status){}
    public record PublicCertificateView(String type,String certificateNo,String issuer,LocalDate expiryDate){}
    public record ProductView(Long id,String name,String description,BigDecimal price,String unit,String image,BigDecimal stock,
        CategoryView category,SupplierView supplier,String certificateNo,BatchView batch,String origin,List<PublicCertificateView> certifications){}
}
