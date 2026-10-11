package com.app.features.auth.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public final class AuthControllerDto {
    private AuthControllerDto(){}
    public record RegisterRequest(@NotBlank String fullName,@Email @NotBlank String email,@NotBlank @Size(min=8) String password){}
    public record LoginRequest(@Email @NotBlank String email,@NotBlank String password){}
    public record VerifyEmailRequest(@Email @NotBlank String email,@Pattern(regexp="\\d{6}") String otp){}
    public record EmailRequest(@Email @NotBlank String email){}
    public record ResetPasswordRequest(@NotBlank String token,@NotBlank @Size(min=8) String newPassword){}
    public record UserView(Long id,String fullName,String email,String role,List<String> roles){}
    public record AuthResult(UserView user,List<String> roles,boolean emailVerificationRequired){}
}
