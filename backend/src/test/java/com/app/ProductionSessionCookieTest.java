package com.app;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("prod")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:prod_cookie;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.mail.delivery-enabled=false"
})
class ProductionSessionCookieTest {
    @Autowired TestRestTemplate http;

    @Test void csrfEndpointCreatesFirebaseForwardableSessionCookie() {
        ResponseEntity<String> response = http.getForEntity("/api/auth/csrf", String.class);
        assertTrue(response.getStatusCode().is2xxSuccessful());
        assertTrue(response.getHeaders().getOrEmpty("Set-Cookie").stream()
            .anyMatch(cookie -> cookie.startsWith("__session=")));
    }
}
