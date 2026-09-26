package com.app.features.orders.serviceimpl;

import com.app.features.auth.entity.UserAccount;
import com.app.features.orders.entity.MarketOrder;
import com.app.features.orders.entity.OrderStatusHistory;
import com.app.features.orders.repository.OrderStatusHistoryRepository;
import com.app.features.orders.service.OrderStatusHistoryService;
import org.springframework.stereotype.Service;

@Service
public class OrderStatusHistoryServiceImpl implements OrderStatusHistoryService {
    private final OrderStatusHistoryRepository history;

    public OrderStatusHistoryServiceImpl(OrderStatusHistoryRepository history) {
        this.history = history;
    }

    @Override
    public void record(MarketOrder order, String status, UserAccount actor, String note) {
        OrderStatusHistory entry = new OrderStatusHistory();
        entry.setOrder(order);
        entry.setStatus(status);
        entry.setActor(actor);
        entry.setNote(note);
        history.save(entry);
    }
}