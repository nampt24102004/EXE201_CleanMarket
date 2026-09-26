package com.app.features.traceability.dto;

import com.app.common.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.*;

public final class TraceControllerDto {
    private TraceControllerDto() { }
    public record BatchRequest(@NotBlank String farmName, @NotBlank String origin, @NotNull LocalDate harvestDate, @NotNull LocalDate packagingDate, LocalDate expiryDate, @NotNull @DecimalMin("0.01") BigDecimal quantity, String certificateNo) { }
    public record BatchView(Long id, Long productId, String batchCode, String traceCode, String farmName, String origin, LocalDate harvestDate, LocalDate packagingDate, LocalDate expiryDate, BigDecimal quantity, String certificateNo, String status, String traceUrl) { }
    public record TraceView(String traceCode, String batchCode, String status, String productName, String productImage, String supplierName, String supplierVerificationStatus, String farmName, String origin, LocalDate harvestDate, LocalDate packagingDate, LocalDate expiryDate, String certificateNo) { }
}
