package com.app;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.web.ServerProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("prod")
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:cleanmarket_prod_cookie;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.mail.delivery-enabled=false"
})
class ProductionSessionCookieTest {
    @Autowired ServerProperties server;

    @Test void firebaseCompatibleSessionCookieIsConfigured() {
        assertEquals("__session", server.getServlet().getSession().getCookie().getName());
    }
}
