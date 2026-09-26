package com.app.features.orders.service;

import com.app.common.ApiResponse;
import com.app.features.orders.dto.OrderServiceDto;
import java.util.*;

public interface ManagerOrderService {
    public ApiResponse<List<OrderServiceDto.OrderView>> list();
}
