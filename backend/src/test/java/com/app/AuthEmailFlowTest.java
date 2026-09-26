package com.app;

import com.app.features.notifications.service.MailService;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:auth_mail;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.auth.email-verification-required=true",
    "app.mail.delivery-enabled=false"
})
@AutoConfigureMockMvc
class AuthEmailFlowTest {
    @Autowired MockMvc mvc;
    @MockitoBean MailService mail;

    @Test void registrationOtpAndPasswordResetFlow() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Mail User\",\"email\":\"mail-flow@example.test\",\"password\":\"OldPass@123\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.emailVerificationRequired").value(true));

        ArgumentCaptor<String> otp = ArgumentCaptor.forClass(String.class);
        verify(mail).sendVerificationOtp(eq("mail-flow@example.test"), eq("Mail User"), otp.capture(), eq(5));
        assertTrue(otp.getValue().matches("\\d{6}"));

        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"mail-flow@example.test\",\"password\":\"OldPass@123\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("EMAIL_NOT_VERIFIED"));

        mvc.perform(post("/api/auth/email/verify").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"mail-flow@example.test\",\"otp\":\"" + otp.getValue() + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.user.email").value("mail-flow@example.test"));

        mvc.perform(post("/api/auth/password/forgot").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"mail-flow@example.test\"}"))
            .andExpect(status().isOk());

        ArgumentCaptor<String> resetUrl = ArgumentCaptor.forClass(String.class);
        verify(mail).sendPasswordResetLink(eq("mail-flow@example.test"), eq("Mail User"), resetUrl.capture(), eq(15));
        Matcher matcher = Pattern.compile("[?&]token=([^&]+)").matcher(resetUrl.getValue());
        assertTrue(matcher.find());
        String token = matcher.group(1);

        mvc.perform(post("/api/auth/password/reset").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"" + token + "\",\"newPassword\":\"NewPass@456\"}"))
            .andExpect(status().isOk());

        mvc.perform(post("/api/auth/password/reset").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"" + token + "\",\"newPassword\":\"AgainPass@789\"}"))
            .andExpect(status().isBadRequest());

        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"mail-flow@example.test\",\"password\":\"NewPass@456\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.user.email").value("mail-flow@example.test"));
    }
}
