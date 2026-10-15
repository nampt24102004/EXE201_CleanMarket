package com.app.features.notifications.controller;

import com.app.common.ApiResponse;
import com.app.features.notifications.service.NotificationService;
import com.app.features.notifications.service.NotificationService.Inbox;
import com.app.features.notifications.service.NotificationService.NotificationView;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/notifications") @PreAuthorize("isAuthenticated()")
public class NotificationController {
    private final NotificationService service;
    public NotificationController(NotificationService service) { this.service = service; }
    @GetMapping public ApiResponse<Inbox> mine() { return ApiResponse.ok(service.mine()); }
    @PutMapping("/{id}/read") public ApiResponse<NotificationView> read(@PathVariable Long id) { return ApiResponse.ok(service.markRead(id)); }
    @PutMapping("/read-all") public ApiResponse<Void> readAll() { service.markAllRead(); return ApiResponse.ok(null); }
}
