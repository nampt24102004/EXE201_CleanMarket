package com.app.features.shipping.serviceimpl;
import com.app.common.BusinessException;
import com.app.features.auth.security.CurrentUser;
import com.app.features.cart.entity.CartItem;
import com.app.features.cart.repository.CartItemRepository;
import com.app.features.shipping.dto.ShippingDto.*;
import com.app.features.shipping.entity.ShippingZone;
import com.app.features.shipping.repository.ShippingZoneRepository;
import com.app.features.shipping.service.ShippingService;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service public class ShippingServiceImpl implements ShippingService {
 private final ShippingZoneRepository zones;private final CartItemRepository cart;private final CurrentUser current;
 public ShippingServiceImpl(ShippingZoneRepository zones,CartItemRepository cart,CurrentUser current){this.zones=zones;this.cart=cart;this.current=current;}
 @Override @Transactional(readOnly=true) public ShippingZone resolve(String address){if(address==null||address.isBlank())throw BusinessException.bad("SHIPPING_ADDRESS_REQUIRED","Vui lòng nhập địa chỉ giao hàng");String n=normalize(address);return zones.findByActiveTrueOrderByShippingFeeAsc().stream().filter(z->Arrays.stream(z.getAddressKeywords().split(",")).map(this::normalize).anyMatch(n::contains)).findFirst().orElseThrow(()->BusinessException.bad("UNSUPPORTED_SHIPPING_AREA","Địa chỉ chưa thuộc khu vực CleanMarket hỗ trợ giao hàng"));}
 @Override public BigDecimal fee(ShippingZone z,BigDecimal subtotal){return z.getFreeShippingThreshold()!=null&&subtotal.compareTo(z.getFreeShippingThreshold())>=0?BigDecimal.ZERO:z.getShippingFee();}
 @Override @Transactional(readOnly=true) public QuoteView quote(String address){BigDecimal subtotal=cart.findByUserId(current.get().getId()).stream().map(this::line).reduce(BigDecimal.ZERO,BigDecimal::add);if(subtotal.signum()<=0)throw BusinessException.bad("EMPTY_CART","Giỏ hàng đang trống");ShippingZone z=resolve(address);BigDecimal f=fee(z,subtotal);return new QuoteView(z.getId(),z.getZoneCode(),z.getZoneName(),subtotal,f,z.getFreeShippingThreshold(),f.signum()==0);}
 @Override @Transactional(readOnly=true) public List<ZoneView> list(){return zones.findAllByOrderByShippingFeeAsc().stream().map(this::view).toList();}
 @Override @Transactional(readOnly=true) public List<ZoneView> listActive(){return zones.findByActiveTrueOrderByShippingFeeAsc().stream().map(this::view).toList();}
 @Override @Transactional public ZoneView create(ZoneRequest r){ShippingZone z=new ShippingZone();apply(z,r);return view(zones.save(z));}
 @Override @Transactional public ZoneView update(Long id,ZoneRequest r){ShippingZone z=zones.findById(id).orElseThrow(()->BusinessException.missing("Khu vực giao hàng"));apply(z,r);return view(z);}
 @Override @Transactional public void delete(Long id){ShippingZone z=zones.findById(id).orElseThrow(()->BusinessException.missing("Khu vực giao hàng"));z.setActive(false);}
 private void apply(ShippingZone z,ZoneRequest r){if(r.zoneCode()==null||r.zoneCode().isBlank()||r.zoneName()==null||r.zoneName().isBlank()||r.addressKeywords()==null||r.addressKeywords().isBlank()||r.shippingFee()==null||r.shippingFee().signum()<0)throw BusinessException.bad("INVALID_SHIPPING_ZONE","Thông tin khu vực giao hàng không hợp lệ");z.setZoneCode(r.zoneCode().trim().toUpperCase(Locale.ROOT));z.setZoneName(r.zoneName().trim());z.setAddressKeywords(r.addressKeywords().trim());z.setShippingFee(r.shippingFee());z.setFreeShippingThreshold(r.freeShippingThreshold());if(r.active()!=null)z.setActive(r.active());}
 private ZoneView view(ShippingZone z){return new ZoneView(z.getId(),z.getZoneCode(),z.getZoneName(),z.getAddressKeywords(),z.getShippingFee(),z.getFreeShippingThreshold(),z.isActive());}
 private BigDecimal line(CartItem i){return i.getProduct().getPrice().multiply(i.getQuantity());}private String normalize(String v){return Normalizer.normalize(v,Normalizer.Form.NFD).replaceAll("\\p{M}","").toLowerCase(Locale.ROOT).trim();}
}
