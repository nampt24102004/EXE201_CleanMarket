package com.app.features.user.controller;

import com.app.common.ApiResponse;
import com.app.features.user.dto.ProfileControllerDto.ProfileView;
import com.app.features.user.dto.ProfileControllerDto.UpdateRequest;
import com.app.features.user.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/users/me") @PreAuthorize("hasRole('USER')")
public class ProfileController {
    private final ProfileService service;
    public ProfileController(ProfileService service) { this.service = service; }
    @GetMapping
    public ApiResponse<ProfileView> get() { return service.get(); }
    @PutMapping @Transactional
    public ApiResponse<ProfileView> update(@Valid @RequestBody UpdateRequest request) { return service.update(request); }
}
