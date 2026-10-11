package com.app.features.suppliers.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;

public final class SupplierControllerDto {
    private SupplierControllerDto() {}
    public record ApplicationRequest(
        @NotBlank @JsonAlias("name") String supplierName,
        @Email String email,
        @NotBlank String phone,
        @NotBlank @JsonAlias("location") String address,
        @NotBlank String supplierType,
        String description,
        String documentUrl,
        @AssertTrue(message = "Bạn phải xác nhận thông tin chính xác") Boolean confirmed
    ) {}
    public record ProfileRequest(
        @NotBlank @JsonAlias("name") String supplierName,
        @Email String email,
        String phone,
        @NotBlank @JsonAlias("location") String address,
        String supplierType,
        String description
    ) {}
    public record DocumentView(Long id, String documentType, String documentName, String originalFileName,
        String fileUrl, String status, String rejectionReason, Instant uploadedAt) {}
    public record SupplierView(Long id, String name, String location, String description, String documentUrl,
        String status, Long ownerId, String applicantName, String email, String phone, String supplierType,
        String rejectionReason, Long reviewedBy, Instant reviewedAt, Instant createdAt, List<DocumentView> documents) {}
    public record DecisionRequest(@NotBlank(message = "Vui lòng nhập lý do từ chối") String reason) {}
}
