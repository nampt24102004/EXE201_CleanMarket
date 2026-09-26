package com.app.features.orders.service;

import com.app.features.orders.dto.OrderServiceDto.*;
import com.app.features.orders.entity.MarketOrder;
import java.util.List;

public interface OrderService {
    OrderView checkout(CheckoutRequest request);
    OrderView owned(Long id);
    OrderView ownedByCode(String code);
    List<OrderView> mine();
    OrderView cancel(Long id);
    OrderView view(MarketOrder order);
}
