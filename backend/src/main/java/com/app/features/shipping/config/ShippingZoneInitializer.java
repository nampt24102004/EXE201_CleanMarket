package com.app.features.shipping.config;

import com.app.features.shipping.entity.ShippingZone;
import com.app.features.shipping.repository.ShippingZoneRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ShippingZoneInitializer implements ApplicationRunner {
    private final ShippingZoneRepository zones;
    public ShippingZoneInitializer(ShippingZoneRepository zones){this.zones=zones;}
    @Override @Transactional public void run(ApplicationArguments args){
        if(zones.count()>0)return;
        zones.saveAll(List.of(
            zone("HOA_LAC","Hòa Lạc","Hòa Lạc,Thạch Hòa,Khu Công nghệ cao","15000","300000"),
            zone("THACH_THAT_QUOC_OAI","Thạch Thất - Quốc Oai","Thạch Thất,Quốc Oai","25000","500000"),
            zone("BA_VI_SON_TAY","Ba Vì - Sơn Tây","Ba Vì,Sơn Tây","35000","700000")
        ));
    }
    private ShippingZone zone(String code,String name,String keywords,String fee,String threshold){ShippingZone z=new ShippingZone();z.setZoneCode(code);z.setZoneName(name);z.setAddressKeywords(keywords);z.setShippingFee(new BigDecimal(fee));z.setFreeShippingThreshold(new BigDecimal(threshold));z.setActive(true);return z;}
}
