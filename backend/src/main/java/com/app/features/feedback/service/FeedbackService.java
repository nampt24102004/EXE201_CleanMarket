package com.app.features.feedback.service;

import com.app.common.*;
import com.app.features.feedback.dto.FeedbackControllerDto.ComplaintRequest;
import com.app.features.feedback.dto.FeedbackControllerDto.ComplaintView;
import com.app.features.feedback.dto.FeedbackControllerDto.RefundRequest;
import com.app.features.feedback.dto.FeedbackControllerDto.RefundView;
import com.app.features.feedback.dto.FeedbackControllerDto.ResolutionRequest;
import com.app.features.feedback.dto.FeedbackControllerDto.ReviewRequest;
import com.app.features.feedback.dto.FeedbackControllerDto.ReviewView;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.*;

public interface FeedbackService {
    public ApiResponse<List<ReviewView>> productReviews(Long productId);
    public ApiResponse<ReviewView> review(@Valid ReviewRequest request);
    public ApiResponse<ComplaintView> complaint(@Valid ComplaintRequest request);
    public ApiResponse<List<ComplaintView>> myComplaints();
    public ApiResponse<List<ComplaintView>> pending();
    public ApiResponse<ComplaintView> resolve(Long id, @Valid ResolutionRequest request);
    public ApiResponse<RefundView> refund(Long id, @Valid RefundRequest request);
}
