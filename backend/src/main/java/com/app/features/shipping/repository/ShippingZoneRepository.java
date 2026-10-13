package com.app.features.shipping.repository;
import com.app.features.shipping.entity.ShippingZone;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ShippingZoneRepository extends JpaRepository<ShippingZone,Long>{List<ShippingZone> findByActiveTrueOrderByShippingFeeAsc();List<ShippingZone> findAllByOrderByShippingFeeAsc();Optional<ShippingZone> findByZoneCodeIgnoreCase(String zoneCode);}
