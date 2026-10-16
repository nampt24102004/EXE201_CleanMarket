package com.app.features.feedback.service;

import com.app.common.ApiResponse;
import com.app.features.feedback.dto.RefundControllerDto.*;
import jakarta.validation.Valid;
import java.util.List;

public interface RefundService {
    ApiResponse<List<RefundView>> list(String status);
    ApiResponse<List<RefundView>> mine();
    ApiResponse<List<EligibleOrder>> eligibleOrders();
    ApiResponse<RefundView> submitBankInfo(Long id, @Valid BankInfoRequest request);
    ApiResponse<RefundView> approveBankInfo(Long id);
    ApiResponse<RefundView> rejectBankInfo(Long id, @Valid ReviewRequest request);
    ApiResponse<RefundView> complete(Long id, @Valid CompletionRequest request);
}
