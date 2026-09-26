package com.app.features.payments.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.payos")
@Getter @Setter
public class PayOSProperties {
    private String clientId = "";
    private String apiKey = "";
    private String checksumKey = "";
    private String returnUrl = "http://localhost:5173/payment/success";
    private String cancelUrl = "http://localhost:5173/payment/cancel";
    private long linkTtlSeconds = 900;

    public boolean configured() {
        return notBlank(clientId) && notBlank(apiKey) && notBlank(checksumKey);
    }

    private boolean notBlank(String value) { return value != null && !value.isBlank(); }
}