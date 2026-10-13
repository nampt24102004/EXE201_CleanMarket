package com.app.features.shipping.service;
import com.app.features.shipping.dto.ShippingDto.*;
import com.app.features.shipping.entity.ShippingZone;
import java.math.BigDecimal;
import java.util.List;
public interface ShippingService {ShippingZone resolve(String address);BigDecimal fee(ShippingZone zone,BigDecimal subtotal);QuoteView quote(String address);List<ZoneView> list();List<ZoneView> listActive();ZoneView create(ZoneRequest request);ZoneView update(Long id,ZoneRequest request);void delete(Long id);}
