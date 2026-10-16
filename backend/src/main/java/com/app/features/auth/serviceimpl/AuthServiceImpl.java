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
    private final RoleRepository roles;private final UserRoleAssignmentRepository assignments;private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final boolean emailVerificationRequired;private final String googleClientId;
    public AuthServiceImpl(UserRepository users,PasswordEncoder passwords,CurrentUser currentUser,AccountTokenService tokens,
        RoleRepository roles,UserRoleAssignmentRepository assignments,com.fasterxml.jackson.databind.ObjectMapper objectMapper,
        @Value("${app.auth.email-verification-required:true}") boolean required,
        @Value("${app.google.client-id:}") String googleClientId){
        this.users=users;this.passwords=passwords;this.currentUser=currentUser;this.tokens=tokens;this.roles=roles;this.assignments=assignments;
        this.objectMapper=objectMapper;this.emailVerificationRequired=required;this.googleClientId=googleClientId;
    }
    @Override @Transactional public ApiResponse<AuthResult> register(RegisterRequest request){
        String email=request.email().trim().toLowerCase();if(users.existsByEmailIgnoreCase(email))throw BusinessException.conflict("EMAIL_EXISTS","Email đã được sử dụng");
        UserAccount user=new UserAccount();user.setEmail(email);user.setFullName(request.fullName().trim());user.setPasswordHash(passwords.encode(request.password()));user.setRole("USER");user.setEnabled(!emailVerificationRequired);users.save(user);assign(user,"USER");
        if(emailVerificationRequired)tokens.sendVerificationOtp(user);return ApiResponse.ok(result(user,emailVerificationRequired),emailVerificationRequired?"OTP đã được gửi tới email của bạn":"Đăng ký thành công");
    }
    @Override public ApiResponse<AuthResult> login(LoginRequest request){UserAccount user=users.findByEmailIgnoreCase(request.email().trim()).orElseThrow(()->BusinessException.bad("INVALID_CREDENTIALS","Email hoặc mật khẩu không đúng"));if(!passwords.matches(request.password(),user.getPasswordHash()))throw BusinessException.bad("INVALID_CREDENTIALS","Email hoặc mật khẩu không đúng");if(user.isLocked())throw BusinessException.forbidden("ACCOUNT_LOCKED","Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên");if(!user.isEnabled())throw BusinessException.bad("EMAIL_NOT_VERIFIED","Email chưa được xác thực");return ApiResponse.ok(result(user,false));}
    @Override @Transactional public ApiResponse<AuthResult> loginWithGoogle(GoogleAuthRequest request){
        String token=request.credential()!=null?request.credential().trim():"";
        if(token.isEmpty())throw BusinessException.bad("INVALID_GOOGLE_TOKEN","Mã xác thực Google không được để trống");
        try{
            java.net.http.HttpClient client=java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest httpReq=java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://oauth2.googleapis.com/tokeninfo?id_token="+java.net.URLEncoder.encode(token,java.nio.charset.StandardCharsets.UTF_8)))
                .GET().timeout(java.time.Duration.ofSeconds(10)).build();
            java.net.http.HttpResponse<String> resp=client.send(httpReq,java.net.http.HttpResponse.BodyHandlers.ofString());
            if(resp.statusCode()!=200)throw BusinessException.bad("INVALID_GOOGLE_TOKEN","Mã xác thực Google không hợp lệ hoặc đã hết hạn");
            com.fasterxml.jackson.databind.JsonNode node=objectMapper.readTree(resp.body());
            String email=node.path("email").asText(null);
            String emailVerified=node.path("email_verified").asText("false");
            String name=node.path("name").asText("");
            if(email==null||email.isBlank()||!"true".equalsIgnoreCase(emailVerified))throw BusinessException.bad("INVALID_GOOGLE_TOKEN","Tài khoản Google chưa được xác thực email");
            if(googleClientId!=null&&!googleClientId.isBlank()){
                String aud=node.path("aud").asText("");
                if(!googleClientId.equals(aud))throw BusinessException.bad("INVALID_GOOGLE_AUDIENCE","Google Client ID không khớp");
            }
            String normalizedEmail=email.trim().toLowerCase();
            UserAccount user=users.findByEmailIgnoreCase(normalizedEmail).orElse(null);
            if(user==null){
                user=new UserAccount();user.setEmail(normalizedEmail);
                user.setFullName(name.isBlank()?normalizedEmail.split("@")[0]:name.trim());
                user.setPasswordHash(passwords.encode(UUID.randomUUID().toString()));
                user.setRole("USER");user.setEnabled(true);users.save(user);assign(user,"USER");
            }else{
                if(user.isLocked())throw BusinessException.forbidden("ACCOUNT_LOCKED","Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên");
                if(!user.isEnabled()){user.setEnabled(true);users.save(user);}
                if((user.getFullName()==null||user.getFullName().isBlank())&&!name.isBlank()){user.setFullName(name.trim());users.save(user);}
            }
            return ApiResponse.ok(result(user,false),"Đăng nhập Google thành công");
        }catch(BusinessException be){throw be;}catch(Exception e){throw BusinessException.bad("GOOGLE_AUTH_FAILED","Không thể kết nối đến máy chủ xác thực Google: "+e.getMessage());}
    }
    @Override public ApiResponse<AuthResult> verifyEmail(VerifyEmailRequest request){UserAccount user=tokens.verifyEmail(request.email(),request.otp());if(user.isLocked())throw BusinessException.forbidden("ACCOUNT_LOCKED","Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên");return ApiResponse.ok(result(user,false),"Xác thực email thành công");}
    @Override public ApiResponse<Void> resendVerificationOtp(EmailRequest request){tokens.resendVerificationOtp(request.email());return ApiResponse.ok(null,"OTP mới đã được gửi");}
    @Override public ApiResponse<Void> forgotPassword(EmailRequest request){tokens.sendPasswordResetLink(request.email());return ApiResponse.ok(null,"Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi");}
    @Override public ApiResponse<Void> resetPassword(ResetPasswordRequest request){tokens.resetPassword(request.token(),request.newPassword());return ApiResponse.ok(null,"Đặt lại mật khẩu thành công");}
    @Override public ApiResponse<UserView> me(){return ApiResponse.ok(view(currentUser.get()));}
    private void assign(UserAccount user,String name){Role role=roles.findByNameIgnoreCase(name).orElseGet(()->{Role r=new Role();r.setName(name);return roles.save(r);});if(!assignments.existsByUserIdAndRoleId(user.getId(),role.getId())){UserRoleAssignment a=new UserRoleAssignment();a.setUser(user);a.setRole(role);assignments.save(a);}}
    private List<String> roleNames(UserAccount user){LinkedHashSet<String> result=new LinkedHashSet<>();assignments.findByUserId(user.getId()).forEach(a->result.add(a.getRole().getName().toUpperCase()));result.add(user.getRole().toUpperCase());return List.copyOf(result);}
    private UserView view(UserAccount user){List<String> names=roleNames(user);return new UserView(user.getId(),user.getFullName(),user.getEmail(),user.getRole(),names);}
    private AuthResult result(UserAccount user,boolean verificationRequired){UserView value=view(user);return new AuthResult(value,value.roles(),verificationRequired);}
}
