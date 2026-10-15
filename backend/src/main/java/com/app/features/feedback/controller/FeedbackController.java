package com.app.features.feedback.controller;

import com.app.common.*;
import com.app.features.feedback.dto.FeedbackControllerDto.ComplaintRequest;
import com.app.features.feedback.dto.FeedbackControllerDto.ComplaintView;
import com.app.features.feedback.dto.FeedbackControllerDto.RefundRequest;
import com.app.features.feedback.dto.FeedbackControllerDto.RefundView;
import com.app.features.feedback.dto.FeedbackControllerDto.ResolutionRequest;
import com.app.features.feedback.dto.FeedbackControllerDto.ReviewRequest;
import com.app.features.feedback.dto.FeedbackControllerDto.ReviewView;
import com.app.features.feedback.service.FeedbackService;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api") @Transactional(readOnly = true)
public class FeedbackController {
    private final FeedbackService service;
    public FeedbackController(FeedbackService service) { this.service = service; }
    @GetMapping("/products/{productId}/reviews")
    public ApiResponse<List<ReviewView>> productReviews(@PathVariable Long productId) { return service.productReviews(productId); }
    @PostMapping("/reviews") @PreAuthorize("hasRole('USER')") @Transactional
    public ApiResponse<ReviewView> review(@Valid @RequestBody ReviewRequest request) { return service.review(request); }
    @PostMapping("/complaints") @PreAuthorize("hasRole('USER')") @Transactional
    public ApiResponse<ComplaintView> complaint(@Valid @RequestBody ComplaintRequest request) { return service.complaint(request); }
    @GetMapping("/complaints/my") @PreAuthorize("hasRole('USER')")
    public ApiResponse<List<ComplaintView>> myComplaints() { return service.myComplaints(); }
    @GetMapping("/partner/complaints") @PreAuthorize("hasRole('PARTNER')")
    public ApiResponse<List<ComplaintView>> partnerComplaints() { return service.partnerComplaints(); }
    @GetMapping("/manager/complaints") @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ApiResponse<List<ComplaintView>> pending() { return service.pending(); }
    @PutMapping("/manager/complaints/{id}/resolve") @PreAuthorize("hasAnyRole('MANAGER','ADMIN')") @Transactional
    public ApiResponse<ComplaintView> resolve(@PathVariable Long id, @Valid @RequestBody ResolutionRequest request) { return service.resolve(id, request); }
    @PostMapping("/manager/complaints/{id}/refunds") @PreAuthorize("hasAnyRole('MANAGER','ADMIN')") @Transactional
    public ApiResponse<RefundView> refund(@PathVariable Long id, @Valid @RequestBody RefundRequest request) { return service.refund(id, request); }
}
