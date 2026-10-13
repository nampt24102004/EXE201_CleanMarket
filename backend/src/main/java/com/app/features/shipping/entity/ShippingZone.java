package com.app.features.shipping.entity;
import com.app.common.BaseEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;
@Entity @Table(name="shipping_zones",uniqueConstraints=@UniqueConstraint(columnNames="zone_code")) @Getter @Setter
public class ShippingZone extends BaseEntity {
 @Column(name="zone_code",nullable=false,length=40) private String zoneCode;
 @Column(nullable=false,length=160) private String zoneName;
 @Column(nullable=false,length=1000) private String addressKeywords;
 @Column(nullable=false,precision=15,scale=2) private BigDecimal shippingFee;
 @Column(precision=15,scale=2) private BigDecimal freeShippingThreshold;
 @Column(nullable=false) private boolean active=true;
}
