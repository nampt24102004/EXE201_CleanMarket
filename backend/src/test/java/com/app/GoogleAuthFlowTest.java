package com.app;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:auth_google;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.auth.email-verification-required=true",
    "app.mail.delivery-enabled=false"
})
@AutoConfigureMockMvc
class GoogleAuthFlowTest {
    @Autowired MockMvc mvc;

    @Test void googleAuthWithBlankCredentialShouldFailValidation() throws Exception {
        mvc.perform(post("/api/auth/google").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"credential\":\"\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test void googleAuthWithInvalidTokenShouldFail() throws Exception {
        mvc.perform(post("/api/auth/google").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"credential\":\"invalid_dummy_jwt_token\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").isNotEmpty());
    }
}
