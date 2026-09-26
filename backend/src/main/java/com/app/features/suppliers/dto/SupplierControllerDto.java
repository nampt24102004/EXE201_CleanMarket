package com.app.features.suppliers.dto;

import com.app.common.*;
import jakarta.validation.constraints.*;

public final class SupplierControllerDto {
    private SupplierControllerDto() { }
    public record ApplicationRequest(@NotBlank String name, @NotBlank String location, String description, @NotBlank String documentUrl) { }
    public record ProfileRequest(@NotBlank String name, @NotBlank String location, String description) { }
    public record SupplierView(Long id, String name, String location, String description, @NotBlank String documentUrl, String status, Long ownerId) { }
    public record DecisionRequest(String reason) { }
}
