package com.app;

import com.app.common.BusinessException;
import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.security.CurrentUser;
import com.app.features.cart.entity.CartItem;
import com.app.features.cart.repository.CartItemRepository;
import com.app.features.products.entity.Product;
import com.app.features.promotions.dto.VoucherDto.CheckoutQuoteRequest;
import com.app.features.promotions.entity.Voucher;
import com.app.features.promotions.enums.*;
import com.app.features.promotions.repository.*;
import com.app.features.promotions.serviceimpl.VoucherServiceImpl;
import com.app.features.shipping.entity.ShippingZone;
import com.app.features.shipping.service.ShippingService;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.suppliers.repository.SupplierRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoucherQuoteServiceTest {
 @Mock VoucherRepository vouchers;@Mock VoucherUsageRepository usages;@Mock OrderVoucherRepository orderVouchers;@Mock SupplierRepository suppliers;@Mock CartItemRepository cart;@Mock CurrentUser current;@Mock ShippingService shipping;
 VoucherServiceImpl service;UserAccount user;Supplier farmA;Supplier farmB;
 @BeforeEach void setup(){service=new VoucherServiceImpl(vouchers,usages,orderVouchers,suppliers,cart,current,shipping);user=new UserAccount();user.setId(1L);when(current.get()).thenReturn(user);farmA=supplier(10L,"Farm A");farmB=supplier(20L,"Farm B");when(cart.findByUserId(1L)).thenReturn(List.of(item(farmA,"100000"),item(farmB,"50000")));ShippingZone zone=new ShippingZone();zone.setId(1L);zone.setZoneName("Hòa Lạc");zone.setShippingFee(new BigDecimal("15000"));when(shipping.resolve("Hòa Lạc")).thenReturn(zone);when(shipping.fee(zone,new BigDecimal("150000"))).thenReturn(new BigDecimal("15000"));lenient().when(vouchers.findByScopeOrderByCreatedAtDesc(any())).thenReturn(List.of());}
 @Test void quoteWithoutVoucherAddsShippingOnce(){var q=quote(null,List.of());assertEquals(new BigDecimal("165000"),q.totalAmount());assertEquals(2,q.suppliers().size());}
 @Test void partnerPercentageOnlyDiscountsOwnedSubtotal(){stub(voucher("FARMA10",VoucherScope.PARTNER,VoucherDiscountType.PERCENTAGE,"10",farmA));var q=quote(null,List.of("FARMA10"));assertEquals(new BigDecimal("10000.00"),q.partnerDiscount());assertEquals(new BigDecimal("155000.00"),q.totalAmount());}
 @Test void platformFixedDiscountAppliesAfterPartnerDiscount(){stub(voucher("CLEAN20",VoucherScope.PLATFORM,VoucherDiscountType.FIXED_AMOUNT,"20000",null));assertEquals(new BigDecimal("145000"),quote("CLEAN20",List.of()).totalAmount());}
 @Test void partnerAndPlatformCanStack(){stub(voucher("FARMA10",VoucherScope.PARTNER,VoucherDiscountType.PERCENTAGE,"10",farmA));stub(voucher("CLEAN20",VoucherScope.PLATFORM,VoucherDiscountType.FIXED_AMOUNT,"20000",null));assertEquals(new BigDecimal("135000.00"),quote("CLEAN20",List.of("FARMA10")).totalAmount());}
 @Test void partnerVoucherForSupplierOutsideCartIsRejected(){Supplier other=supplier(30L,"Other");stub(voucher("OTHER10",VoucherScope.PARTNER,VoucherDiscountType.PERCENTAGE,"10",other));assertEquals("VOUCHER_SUPPLIER_MISMATCH",assertThrows(BusinessException.class,()->quote(null,List.of("OTHER10"))).code());}
 @Test void expiredVoucherIsRejected(){Voucher v=voucher("OLD",VoucherScope.PLATFORM,VoucherDiscountType.FIXED_AMOUNT,"1000",null);v.setExpiresAt(Instant.now().minusSeconds(1));stub(v);assertEquals("VOUCHER_NOT_ACTIVE",assertThrows(BusinessException.class,()->quote("OLD",List.of())).code());}
 @Test void minimumAmountIsEnforced(){Voucher v=voucher("BIG",VoucherScope.PLATFORM,VoucherDiscountType.FIXED_AMOUNT,"1000",null);v.setMinimumOrderAmount(new BigDecimal("200000"));stub(v);assertEquals("VOUCHER_MINIMUM_NOT_MET",assertThrows(BusinessException.class,()->quote("BIG",List.of())).code());}
 @Test void percentageDiscountHonorsMaximumCap(){Voucher v=voucher("CAP",VoucherScope.PLATFORM,VoucherDiscountType.PERCENTAGE,"50",null);v.setMaximumDiscountAmount(new BigDecimal("30000"));stub(v);assertEquals(new BigDecimal("30000"),quote("CAP",List.of()).platformDiscount());}
 @Test void voucherWorksForEveryCustomer(){Voucher v=voucher("CMNEW1",VoucherScope.PLATFORM,VoucherDiscountType.PERCENTAGE,"20",null);v.setNewCustomerOnly(true);stub(v);assertEquals(new BigDecimal("30000.00"),quote("CMNEW1",List.of()).platformDiscount());}
 @Test void voucherCanOnlyBeUsedOncePerAccount(){Voucher v=voucher("CMNEW1",VoucherScope.PLATFORM,VoucherDiscountType.PERCENTAGE,"20",null);stub(v);when(usages.countByVoucherIdAndUserIdAndStatusIn(eq(v.getId()),eq(1L),anyCollection())).thenReturn(1L);assertEquals("VOUCHER_CUSTOMER_LIMIT",assertThrows(BusinessException.class,()->quote("CMNEW1",List.of())).code());}
 private com.app.features.promotions.dto.VoucherDto.CheckoutQuote quote(String platform,List<String> partner){return service.quote(new CheckoutQuoteRequest("Hòa Lạc",platform,partner));}
 private void stub(Voucher v){when(vouchers.findByCodeIgnoreCase(v.getCode())).thenReturn(Optional.of(v));lenient().when(usages.countByVoucherIdAndUserIdAndStatusIn(eq(v.getId()),eq(1L),anyCollection())).thenReturn(0L);}
 private Voucher voucher(String code,VoucherScope scope,VoucherDiscountType type,String value,Supplier supplier){Voucher v=new Voucher();v.setId((long)Math.abs(code.hashCode()));v.setCode(code);v.setName(code);v.setScope(scope);v.setDiscountType(type);v.setDiscountValue(new BigDecimal(value));v.setSupplier(supplier);v.setStatus(VoucherStatus.ACTIVE);v.setActive(true);v.setPerCustomerLimit(1);return v;}
 private Supplier supplier(Long id,String name){Supplier s=new Supplier();s.setId(id);s.setName(name);return s;}
 private CartItem item(Supplier supplier,String price){Product p=new Product();p.setId(supplier.getId());p.setSupplier(supplier);p.setPrice(new BigDecimal(price));CartItem item=new CartItem();item.setProduct(p);item.setQuantity(BigDecimal.ONE);return item;}
}
