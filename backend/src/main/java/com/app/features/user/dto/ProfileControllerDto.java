package com.app.features.user.dto;

import jakarta.validation.constraints.NotBlank;

public final class ProfileControllerDto {
    private ProfileControllerDto() { }
    public record ProfileView(Long id, String email, String fullName) { }
    public record UpdateRequest(@NotBlank String fullName) { }
}
