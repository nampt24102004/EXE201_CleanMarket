package com.app.features.cart.dto;

import com.app.common.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.*;

public final class CartControllerDto {
    private CartControllerDto() { }
    public record ItemRequest(@NotNull Long productId, @NotNull @DecimalMin("0.01") BigDecimal quantity) { }
    public record QuantityRequest(@NotNull @DecimalMin("0.01") BigDecimal quantity) { }
    public record CartView(Long id, Long productId, String productName, String supplierName, BigDecimal price, String unit, BigDecimal quantity, BigDecimal lineTotal) { }
}
