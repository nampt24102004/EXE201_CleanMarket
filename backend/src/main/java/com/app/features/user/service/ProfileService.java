package com.app.features.user.service;

import com.app.common.ApiResponse;
import com.app.features.user.dto.ProfileControllerDto.ProfileView;
import com.app.features.user.dto.ProfileControllerDto.UpdateRequest;
import jakarta.validation.Valid;

public interface ProfileService {
    public ApiResponse<ProfileView> get();
    public ApiResponse<ProfileView> update(@Valid UpdateRequest request);
}
