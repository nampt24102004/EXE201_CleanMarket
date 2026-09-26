package com.app.features.auth.serviceimpl;

import com.app.common.BusinessException;
import com.app.features.auth.entity.EmailVerificationOtp;
import com.app.features.auth.entity.PasswordResetToken;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.repository.EmailVerificationOtpRepository;
import com.app.features.auth.repository.PasswordResetTokenRepository;
import com.app.features.auth.repository.UserRepository;
import com.app.features.auth.service.AccountTokenService;
import com.app.features.notifications.service.MailService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountTokenServiceImpl implements AccountTokenService {
    private final EmailVerificationOtpRepository otps;
    private final PasswordResetTokenRepository resetTokens;
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final MailService mail;
    private final SecureRandom random = new SecureRandom();
    private final int otpTtlMinutes;
    private final int resendSeconds;
    private final int maxAttempts;
    private final int resetTtlMinutes;
    private final String frontendUrl;

    public AccountTokenServiceImpl(EmailVerificationOtpRepository otps, PasswordResetTokenRepository resetTokens,
            UserRepository users, PasswordEncoder passwords, MailService mail,
            @Value("${app.mail.otp-ttl-minutes:5}") int otpTtlMinutes,
            @Value("${app.mail.otp-resend-seconds:60}") int resendSeconds,
            @Value("${app.mail.otp-max-attempts:5}") int maxAttempts,
            @Value("${app.mail.reset-ttl-minutes:15}") int resetTtlMinutes,
            @Value("${app.frontend.base-url}") String frontendUrl) {
        this.otps = otps; this.resetTokens = resetTokens; this.users = users; this.passwords = passwords; this.mail = mail;
        this.otpTtlMinutes = otpTtlMinutes; this.resendSeconds = resendSeconds; this.maxAttempts = maxAttempts; this.resetTtlMinutes = resetTtlMinutes; this.frontendUrl = frontendUrl;
    }

    @Override @Transactional
    public void sendVerificationOtp(UserAccount user) {
        invalidateOtps(user.getId());
        createAndSendOtp(user);
    }

    @Override @Transactional
    public UserAccount verifyEmail(String email, String code) {
        UserAccount user = users.findByEmailIgnoreCase(normalize(email)).orElseThrow(() -> BusinessException.bad("INVALID_OTP", "Mã OTP không hợp lệ hoặc đã hết hạn"));
        if (user.isEnabled()) return user;
        EmailVerificationOtp otp = otps.findTopByUserIdAndConsumedAtIsNullOrderByCreatedAtDesc(user.getId()).orElseThrow(() -> BusinessException.bad("INVALID_OTP", "Mã OTP không hợp lệ hoặc đã hết hạn"));
        Instant now = Instant.now();
        if (otp.getExpiresAt().isBefore(now) || otp.getFailedAttempts() >= maxAttempts) {
            otp.setConsumedAt(now); otps.save(otp);
            throw BusinessException.bad("OTP_EXPIRED", "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới");
        }
        if (!passwords.matches(code, otp.getCodeHash())) {
            otp.setFailedAttempts(otp.getFailedAttempts() + 1);
            if (otp.getFailedAttempts() >= maxAttempts) otp.setConsumedAt(now);
            otps.save(otp);
            throw BusinessException.bad("INVALID_OTP", "Mã OTP không chính xác");
        }
        otp.setConsumedAt(now); user.setEnabled(true); otps.save(otp); return users.save(user);
    }

    @Override @Transactional
    public void resendVerificationOtp(String email) {
        UserAccount user = users.findByEmailIgnoreCase(normalize(email)).orElseThrow(() -> BusinessException.bad("ACCOUNT_NOT_PENDING", "Không tìm thấy tài khoản chờ xác thực"));
        if (user.isEnabled()) throw BusinessException.conflict("EMAIL_ALREADY_VERIFIED", "Email đã được xác thực");
        otps.findTopByUserIdAndConsumedAtIsNullOrderByCreatedAtDesc(user.getId()).ifPresent(latest -> {
            if (latest.getCreatedAt().plusSeconds(resendSeconds).isAfter(Instant.now())) throw BusinessException.bad("OTP_RESEND_TOO_SOON", "Vui lòng chờ trước khi gửi lại OTP");
        });
        invalidateOtps(user.getId()); createAndSendOtp(user);
    }

    @Override @Transactional
    public void sendPasswordResetLink(String email) {
        users.findByEmailIgnoreCase(normalize(email)).filter(UserAccount::isEnabled).ifPresent(user -> {
            Instant now = Instant.now();
            resetTokens.findByUserIdAndUsedAtIsNull(user.getId()).forEach(item -> item.setUsedAt(now));
            String rawToken = randomToken();
            PasswordResetToken token = new PasswordResetToken(); token.setUser(user); token.setTokenHash(hash(rawToken)); token.setExpiresAt(now.plus(resetTtlMinutes, ChronoUnit.MINUTES)); resetTokens.save(token);
            mail.sendPasswordResetLink(user.getEmail(), user.getFullName(), frontendUrl + "/reset-password?token=" + rawToken, resetTtlMinutes);
        });
    }

    @Override @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken token = resetTokens.findByTokenHash(hash(rawToken)).orElseThrow(() -> BusinessException.bad("INVALID_RESET_TOKEN", "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn"));
        if (token.getUsedAt() != null || token.getExpiresAt().isBefore(Instant.now())) throw BusinessException.bad("INVALID_RESET_TOKEN", "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
        token.setUsedAt(Instant.now()); token.getUser().setPasswordHash(passwords.encode(newPassword)); resetTokens.save(token); users.save(token.getUser());
    }

    private void createAndSendOtp(UserAccount user) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        EmailVerificationOtp otp = new EmailVerificationOtp(); otp.setUser(user); otp.setCodeHash(passwords.encode(code)); otp.setExpiresAt(Instant.now().plus(otpTtlMinutes, ChronoUnit.MINUTES)); otps.save(otp);
        mail.sendVerificationOtp(user.getEmail(), user.getFullName(), code, otpTtlMinutes);
    }
    private void invalidateOtps(Long userId) { Instant now = Instant.now(); otps.findByUserIdAndConsumedAtIsNull(userId).forEach(item -> item.setConsumedAt(now)); }
    private String randomToken() { byte[] bytes = new byte[32]; random.nextBytes(bytes); return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes); }
    private String hash(String value) { try { return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); } catch (NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); } }
    private String normalize(String email) { return email == null ? "" : email.trim().toLowerCase(); }
}