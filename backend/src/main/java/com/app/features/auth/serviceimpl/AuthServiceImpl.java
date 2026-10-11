package com.app.features.auth.serviceimpl;

import com.app.common.*;
import com.app.features.auth.dto.AuthControllerDto.*;
import com.app.features.auth.entity.*;
import com.app.features.auth.repository.*;
import com.app.features.auth.security.CurrentUser;
import com.app.features.auth.service.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {
    private final UserRepository users;private final PasswordEncoder passwords;private final CurrentUser currentUser;private final AccountTokenService tokens;
    private final RoleRepository roles;private final UserRoleAssignmentRepository assignments;private final boolean emailVerificationRequired;
    public AuthServiceImpl(UserRepository users,PasswordEncoder passwords,CurrentUser currentUser,AccountTokenService tokens,
        RoleRepository roles,UserRoleAssignmentRepository assignments,@Value("${app.auth.email-verification-required:true}") boolean required){
        this.users=users;this.passwords=passwords;this.currentUser=currentUser;this.tokens=tokens;this.roles=roles;this.assignments=assignments;this.emailVerificationRequired=required;
    }
    @Override @Transactional public ApiResponse<AuthResult> register(RegisterRequest request){
        String email=request.email().trim().toLowerCase();if(users.existsByEmailIgnoreCase(email))throw BusinessException.conflict("EMAIL_EXISTS","Email đã được sử dụng");
        UserAccount user=new UserAccount();user.setEmail(email);user.setFullName(request.fullName().trim());user.setPasswordHash(passwords.encode(request.password()));user.setRole("USER");user.setEnabled(!emailVerificationRequired);users.save(user);assign(user,"USER");
        if(emailVerificationRequired)tokens.sendVerificationOtp(user);return ApiResponse.ok(result(user,emailVerificationRequired),emailVerificationRequired?"OTP đã được gửi tới email của bạn":"Đăng ký thành công");
    }
    @Override public ApiResponse<AuthResult> login(LoginRequest request){UserAccount user=users.findByEmailIgnoreCase(request.email().trim()).orElseThrow(()->BusinessException.bad("INVALID_CREDENTIALS","Email hoặc mật khẩu không đúng"));if(!passwords.matches(request.password(),user.getPasswordHash()))throw BusinessException.bad("INVALID_CREDENTIALS","Email hoặc mật khẩu không đúng");if(!user.isEnabled())throw BusinessException.bad("EMAIL_NOT_VERIFIED","Email chưa được xác thực");return ApiResponse.ok(result(user,false));}
    @Override public ApiResponse<AuthResult> verifyEmail(VerifyEmailRequest request){return ApiResponse.ok(result(tokens.verifyEmail(request.email(),request.otp()),false),"Xác thực email thành công");}
    @Override public ApiResponse<Void> resendVerificationOtp(EmailRequest request){tokens.resendVerificationOtp(request.email());return ApiResponse.ok(null,"OTP mới đã được gửi");}
    @Override public ApiResponse<Void> forgotPassword(EmailRequest request){tokens.sendPasswordResetLink(request.email());return ApiResponse.ok(null,"Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi");}
    @Override public ApiResponse<Void> resetPassword(ResetPasswordRequest request){tokens.resetPassword(request.token(),request.newPassword());return ApiResponse.ok(null,"Đặt lại mật khẩu thành công");}
    @Override public ApiResponse<UserView> me(){return ApiResponse.ok(view(currentUser.get()));}
    private void assign(UserAccount user,String name){Role role=roles.findByNameIgnoreCase(name).orElseGet(()->{Role r=new Role();r.setName(name);return roles.save(r);});if(!assignments.existsByUserIdAndRoleId(user.getId(),role.getId())){UserRoleAssignment a=new UserRoleAssignment();a.setUser(user);a.setRole(role);assignments.save(a);}}
    private List<String> roleNames(UserAccount user){LinkedHashSet<String> result=new LinkedHashSet<>();assignments.findByUserId(user.getId()).forEach(a->result.add(a.getRole().getName().toUpperCase()));result.add(user.getRole().toUpperCase());return List.copyOf(result);}
    private UserView view(UserAccount user){List<String> names=roleNames(user);return new UserView(user.getId(),user.getFullName(),user.getEmail(),user.getRole(),names);}
    private AuthResult result(UserAccount user,boolean verificationRequired){UserView value=view(user);return new AuthResult(value,value.roles(),verificationRequired);}
}
