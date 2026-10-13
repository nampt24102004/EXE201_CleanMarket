package com.app.features.shipping.dto;
import java.math.BigDecimal;
public final class ShippingDto { private ShippingDto(){}
 public record ZoneRequest(String zoneCode,String zoneName,String addressKeywords,BigDecimal shippingFee,BigDecimal freeShippingThreshold,Boolean active){}
 public record ZoneView(Long id,String zoneCode,String zoneName,String addressKeywords,BigDecimal shippingFee,BigDecimal freeShippingThreshold,boolean active){}
 public record QuoteRequest(String address){}
 public record QuoteView(Long zoneId,String zoneCode,String zoneName,BigDecimal subtotal,BigDecimal shippingFee,BigDecimal freeShippingThreshold,boolean freeShipping){}
}
