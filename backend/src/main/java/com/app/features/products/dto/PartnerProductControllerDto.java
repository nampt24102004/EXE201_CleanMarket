package com.app.features.products.dto;

import com.app.common.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.*;

public final class PartnerProductControllerDto {
    private PartnerProductControllerDto() { }
    public record ProductRequest(@NotBlank String name, String description, @NotNull @DecimalMin("0.01") BigDecimal price, @NotBlank String unit, @NotNull Long categoryId, String imageUrl, String certificateNo) { }
    public record ProductView(Long id, String name, BigDecimal price, String unit, String approvalStatus, String status, BigDecimal stock) { }
}
