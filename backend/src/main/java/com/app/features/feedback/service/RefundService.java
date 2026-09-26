package com.app.features.feedback.service;

import com.app.common.*;
import com.app.features.feedback.dto.RefundControllerDto.CompletionRequest;
import com.app.features.feedback.dto.RefundControllerDto.RefundView;
import jakarta.validation.Valid;
import java.util.List;

public interface RefundService {
    public ApiResponse<List<RefundView>> list();
    public ApiResponse<RefundView> complete(Long id, @Valid CompletionRequest request);
}
