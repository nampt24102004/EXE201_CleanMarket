package com.app.features.feedback.dto;

import com.app.common.*;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public final class RefundControllerDto {
    private RefundControllerDto() { }
    public record RefundView(Long id, Long complaintId, String orderCode, BigDecimal amount, String status, String note, String providerRef) { }
    public record CompletionRequest(@NotBlank String providerRef, String note) { }
}
