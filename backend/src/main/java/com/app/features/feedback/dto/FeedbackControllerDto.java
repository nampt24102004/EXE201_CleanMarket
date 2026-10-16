package com.app.features.feedback.dto;

import com.app.common.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.*;

public final class FeedbackControllerDto {
    private FeedbackControllerDto() { }
    public record ReviewRequest(@NotNull Long orderItemId, @Min(1) @Max(5) int rating, @NotBlank String comment) { }
    public record ReviewView(Long id, Long orderItemId, Long productId, int rating, String comment, String author) { }
    public record ComplaintRequest(@NotNull Long orderId, @NotBlank String reason, @NotBlank String description, Long supplierOrderId, String requestType, BigDecimal requestedAmount) { }
    public record ComplaintView(Long id, String orderCode, String reason, String description, String status, String resolution, Long supplierOrderId, String supplierName, java.time.Instant createdAt,
        Long orderId, String requestType, BigDecimal requestedAmount) { }
    public record ResolutionRequest(@NotBlank String resolution) { }
    public record RefundRequest(@NotNull @DecimalMin("0.01") BigDecimal amount, String note) { }
    public record RefundView(Long id, Long complaintId, BigDecimal amount, String status) { }
}
