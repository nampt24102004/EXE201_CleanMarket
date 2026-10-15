package com.app.features.user.service;

import com.app.common.ApiResponse;
import com.app.features.user.dto.ProfileControllerDto.*;
import jakarta.validation.Valid;
import java.util.List;

public interface ProfileService {
    ApiResponse<ProfileView> get();
    ApiResponse<ProfileView> update(@Valid UpdateRequest request);
    ApiResponse<Void> changePassword(@Valid ChangePasswordRequest request);
    ApiResponse<List<AddressView>> addresses();
    ApiResponse<AddressView> addAddress(@Valid AddressRequest request);
    ApiResponse<AddressView> updateAddress(Long id, @Valid AddressRequest request);
    ApiResponse<Void> deleteAddress(Long id);
}
