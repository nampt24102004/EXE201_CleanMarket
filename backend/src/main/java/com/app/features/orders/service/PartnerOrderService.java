package com.app.features.orders.service;

import com.app.common.*;
import com.app.features.orders.dto.PartnerOrderControllerDto.PartView;
import com.app.features.orders.dto.PartnerOrderControllerDto.StatusRequest;
import java.util.*;

public interface PartnerOrderService {
    public ApiResponse<List<PartView>> mine(boolean includeUnpaid);
    public ApiResponse<PartView> update(Long id, StatusRequest request);
}
