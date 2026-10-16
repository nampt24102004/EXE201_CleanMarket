package com.app.features.orders.config;

import com.app.features.orders.repository.OrderRepository;
import com.app.features.orders.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Returns stock held by abandoned payOS orders without a background job: requests that read stock or orders
 * first sweep expired unpaid orders, at most once a minute. Failures are logged and never break the request.
 */
@Configuration
public class UnpaidOrderSweeper implements WebMvcConfigurer, HandlerInterceptor {
    private static final Logger log = LoggerFactory.getLogger(UnpaidOrderSweeper.class);
    private static final long MIN_INTERVAL_MS = 60_000;
    private final OrderRepository orders; private final OrderService service; private final long linkTtlSeconds;
    private final AtomicLong lastRun = new AtomicLong();

    public UnpaidOrderSweeper(OrderRepository orders, OrderService service, @Value("${app.payos.link-ttl-seconds:900}") long linkTtlSeconds) {
        this.orders = orders; this.service = service; this.linkTtlSeconds = linkTtlSeconds;
    }

    @Override public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(this).addPathPatterns("/api/products", "/api/products/**", "/api/cart/**", "/api/orders/**",
            "/api/partner/orders/**", "/api/partner/products/**", "/api/manager/orders/**", "/api/admin/dashboard/**");
    }

    @Override public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        sweep();
        return true;
    }

    /** Cancels every payOS order whose payment window is over; returns how many were released. */
    public int sweep() {
        long now = System.currentTimeMillis(), previous = lastRun.get();
        if (now - previous < MIN_INTERVAL_MS || !lastRun.compareAndSet(previous, now)) return 0;
        int released = 0;
        // A link can only have been issued after the order was placed, so younger orders cannot have expired yet.
        for (Long id : orders.findUnpaidPayOSCreatedBefore(Instant.now().minusSeconds(linkTtlSeconds))) {
            try { if (service.expireUnpaid(id)) released++; }
            catch (RuntimeException ex) { log.warn("Could not expire unpaid order {}: {}", id, ex.getMessage()); }
        }
        if (released > 0) log.info("Released {} expired unpaid payOS orders", released);
        return released;
    }

    /** Lets tests force a sweep regardless of the once-a-minute throttle. */
    public int sweepNow() { lastRun.set(0); return sweep(); }
}
