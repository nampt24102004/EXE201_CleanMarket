package com.app.features.orders.service;

import com.app.features.auth.entity.UserAccount;
import com.app.features.orders.entity.MarketOrder;

public interface OrderStatusHistoryService {
    void record(MarketOrder order, String status, UserAccount actor, String note);
}