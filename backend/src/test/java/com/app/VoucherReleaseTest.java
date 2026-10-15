package com.app;

import com.app.features.auth.security.CurrentUser;
import com.app.features.cart.repository.CartItemRepository;
import com.app.features.promotions.entity.Voucher;
import com.app.features.promotions.entity.VoucherUsage;
import com.app.features.promotions.enums.VoucherUsageStatus;
import com.app.features.promotions.repository.*;
import com.app.features.promotions.serviceimpl.VoucherServiceImpl;
import com.app.features.shipping.service.ShippingService;
import com.app.features.suppliers.repository.SupplierRepository;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoucherReleaseTest {
 @Mock VoucherRepository vouchers;@Mock VoucherUsageRepository usages;@Mock OrderVoucherRepository orderVouchers;@Mock SupplierRepository suppliers;@Mock CartItemRepository cart;@Mock CurrentUser current;@Mock ShippingService shipping;
 @Test void cancellingOrderReleasesReservedAndRedeemedUsages(){
  VoucherServiceImpl service=new VoucherServiceImpl(vouchers,usages,orderVouchers,suppliers,cart,current,shipping);
  Voucher v=new Voucher();v.setId(7L);v.setUsedCount(2);
  VoucherUsage cod=usage(v,VoucherUsageStatus.REDEEMED);VoucherUsage online=usage(v,VoucherUsageStatus.RESERVED);
  when(usages.findByOrderId(99L)).thenReturn(List.of(cod,online));when(vouchers.lockById(7L)).thenReturn(Optional.of(v));
  service.release(99L);
  assertEquals(VoucherUsageStatus.RELEASED,cod.getStatus());assertEquals(VoucherUsageStatus.RELEASED,online.getStatus());assertEquals(0,v.getUsedCount());
 }
 private VoucherUsage usage(Voucher v,VoucherUsageStatus status){VoucherUsage u=new VoucherUsage();u.setVoucher(v);u.setStatus(status);return u;}
}
