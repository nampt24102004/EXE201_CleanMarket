package com.app.features.user.controller;

import com.app.common.ApiResponse;
import com.app.features.user.dto.ProfileControllerDto.*;
import com.app.features.user.service.ProfileService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Own account for every signed-in role (customers, partners and staff alike). */
@RestController @RequestMapping("/api/users/me") @PreAuthorize("isAuthenticated()")
public class ProfileController {
    private final ProfileService service;
    public ProfileController(ProfileService service) { this.service = service; }
    @GetMapping public ApiResponse<ProfileView> get() { return service.get(); }
    @PutMapping public ApiResponse<ProfileView> update(@Valid @RequestBody UpdateRequest request) { return service.update(request); }
    @PutMapping("/password") public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) { return service.changePassword(request); }
    @GetMapping("/addresses") public ApiResponse<List<AddressView>> addresses() { return service.addresses(); }
    @PostMapping("/addresses") public ApiResponse<AddressView> addAddress(@Valid @RequestBody AddressRequest request) { return service.addAddress(request); }
    @PutMapping("/addresses/{id}") public ApiResponse<AddressView> updateAddress(@PathVariable Long id, @Valid @RequestBody AddressRequest request) { return service.updateAddress(id, request); }
    @DeleteMapping("/addresses/{id}") public ApiResponse<Void> deleteAddress(@PathVariable Long id) { return service.deleteAddress(id); }
}
