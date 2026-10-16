package com.app.features.orders.enums;

/**
 * Customer-facing order status, derived from the supplier parts once payment is settled:
 * CREATED (COD) / PENDING_PAYMENT (payOS) -> CONFIRMED -> SHIPPED (any part on its way) -> DELIVERED (all parts delivered).
 */
public enum OrderStatus {
    CREATED, PENDING_PAYMENT, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
}
