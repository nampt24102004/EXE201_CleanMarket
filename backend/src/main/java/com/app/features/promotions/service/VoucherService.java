package com.app.features.promotions.service;
import com.app.features.auth.entity.UserAccount;import com.app.features.orders.entity.*;import com.app.features.promotions.dto.VoucherDto.*;import com.app.features.promotions.entity.Voucher;import java.math.BigDecimal;import java.util.*;
public interface VoucherService {
 CheckoutQuote quote(CheckoutQuoteRequest request); CheckoutQuote quoteFor(UserAccount user,String address,String platformCode,List<String> partnerCodes);
 List<VoucherView> minePartner();List<VoucherView> platform();VoucherView createPartner(VoucherRequest request);VoucherView createPlatform(VoucherRequest request);VoucherView updatePartner(Long id,VoucherRequest request);VoucherView updatePlatform(Long id,VoucherRequest request);VoucherView statusPartner(Long id,String status);VoucherView statusPlatform(Long id,String status);void deletePartner(Long id);void deletePlatform(Long id);
 void reserve(UserAccount user,MarketOrder order,Map<Long,SupplierOrder> parts,CheckoutQuote quote,String platformCode);void redeem(Long orderId);void release(Long orderId);
}
