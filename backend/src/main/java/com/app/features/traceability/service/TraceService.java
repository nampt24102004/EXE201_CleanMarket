package com.app.features.traceability.service;

import com.app.common.*;
import com.app.features.traceability.dto.TraceControllerDto.BatchRequest;
import com.app.features.traceability.dto.TraceControllerDto.BatchView;
import com.app.features.traceability.dto.TraceControllerDto.TraceView;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.*;

public interface TraceService {
    public ApiResponse<BatchView> create(Long productId, @Valid BatchRequest request);
    public ApiResponse<List<BatchView>> mine(Long productId);
    public ResponseEntity<byte[]> qr(Long id) throws Exception;
    public ApiResponse<TraceView> trace(String traceCode);
}
