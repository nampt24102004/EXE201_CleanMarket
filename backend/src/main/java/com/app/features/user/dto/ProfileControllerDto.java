package com.app.features.user.dto;

import jakarta.validation.constraints.*;

public final class ProfileControllerDto {
    private ProfileControllerDto() { }
    public record ProfileView(Long id, String email, String fullName, String phone, String role) { }
    public record UpdateRequest(@NotBlank String fullName,
        @Pattern(regexp = "^$|0[0-9]{9}", message = "Số điện thoại phải gồm 10 chữ số") String phone) { }
    public record ChangePasswordRequest(@NotBlank(message = "Vui lòng nhập mật khẩu hiện tại") String currentPassword,
        @NotBlank @Size(min = 8, max = 100, message = "Mật khẩu mới phải có từ 8 ký tự") String newPassword) { }
    public record AddressView(Long id, String recipientName, String phone, String addressLine, boolean defaultAddress) { }
    public record AddressRequest(@NotBlank(message = "Vui lòng nhập tên người nhận") @Size(max = 120) String recipientName,
        @NotBlank @Pattern(regexp = "0[0-9]{9}", message = "Số điện thoại phải gồm 10 chữ số") String phone,
        @NotBlank(message = "Vui lòng nhập địa chỉ") @Size(max = 1000) String addressLine,
        boolean defaultAddress) { }
}
