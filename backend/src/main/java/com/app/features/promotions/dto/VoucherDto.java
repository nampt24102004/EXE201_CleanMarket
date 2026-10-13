package com.app.features.promotions.dto;
import java.math.BigDecimal;import java.time.Instant;import java.util.List;
public final class VoucherDto {private VoucherDto(){}
 public record VoucherRequest(String code,String name,String description,String discountType,BigDecimal discountValue,BigDecimal maximumDiscountAmount,BigDecimal minimumOrderAmount,Integer usageLimit,Integer perCustomerLimit,Instant startsAt,Instant expiresAt,String status,Boolean newCustomerOnly){}
 public record VoucherView(Long id,String code,String name,String description,String scope,String discountType,BigDecimal discountValue,BigDecimal maximumDiscountAmount,BigDecimal minimumOrderAmount,Integer usageLimit,int usedCount,Integer perCustomerLimit,Instant startsAt,Instant expiresAt,String status,Long supplierId,String supplierName,boolean newCustomerOnly){}
 public record CheckoutQuoteRequest(String address,String platformVoucherCode,List<String> partnerVoucherCodes){}
 public record SupplierDiscount(Long supplierId,String supplierName,BigDecimal subtotal,String voucherCode,BigDecimal discount,BigDecimal payable){}
 public record CheckoutQuote(BigDecimal subtotal,BigDecimal partnerDiscount,BigDecimal platformDiscount,BigDecimal shippingFee,BigDecimal shippingDiscount,BigDecimal totalAmount,String shippingZone,List<SupplierDiscount> suppliers,List<VoucherView> availablePlatformVouchers,List<VoucherView> availablePartnerVouchers){}
}
