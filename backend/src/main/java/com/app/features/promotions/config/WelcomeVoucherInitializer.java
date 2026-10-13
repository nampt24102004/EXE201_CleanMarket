package com.app.features.promotions.config;

import com.app.features.promotions.entity.Voucher;
import com.app.features.promotions.enums.VoucherDiscountType;
import com.app.features.promotions.enums.VoucherScope;
import com.app.features.promotions.enums.VoucherStatus;
import com.app.features.promotions.repository.VoucherRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class WelcomeVoucherInitializer implements ApplicationRunner {
    private final VoucherRepository vouchers;

    public WelcomeVoucherInitializer(VoucherRepository vouchers) {
        this.vouchers = vouchers;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List.of(
            welcome("CMNEW1", "Ưu đãi CleanMarket", VoucherDiscountType.PERCENTAGE, "20", "50000", "50000"),
            welcome("HELLO2", "Quà tặng mua sắm", VoucherDiscountType.FIXED_AMOUNT, "30000", null, "100000"),
            welcome("FRESH3", "Ưu đãi trải nghiệm CleanMarket", VoucherDiscountType.PERCENTAGE, "15", "40000", "50000")
        ).forEach(voucher -> {
            Voucher saved = vouchers.findByCodeIgnoreCase(voucher.getCode()).orElse(voucher);
            saved.setDescription("Áp dụng cho mọi khách hàng; mỗi tài khoản được sử dụng mã này một lần.");
            saved.setPerCustomerLimit(1);
            saved.setNewCustomerOnly(false);
            vouchers.save(saved);
        });
    }

    private Voucher welcome(String code, String name, VoucherDiscountType type, String value, String maximum, String minimum) {
        Voucher voucher = new Voucher();
        voucher.setCode(code);
        voucher.setName(name);
        voucher.setDescription("Áp dụng cho mọi khách hàng; mỗi tài khoản được sử dụng mã này một lần.");
        voucher.setScope(VoucherScope.PLATFORM);
        voucher.setDiscountType(type);
        voucher.setDiscountValue(new BigDecimal(value));
        voucher.setMaximumDiscountAmount(maximum == null ? null : new BigDecimal(maximum));
        voucher.setMinimumOrderAmount(new BigDecimal(minimum));
        voucher.setUsageLimit(1000);
        voucher.setPerCustomerLimit(1);
        voucher.setStartsAt(Instant.now().minus(1, ChronoUnit.DAYS));
        voucher.setExpiresAt(Instant.now().plus(365, ChronoUnit.DAYS));
        voucher.setStatus(VoucherStatus.ACTIVE);
        voucher.setActive(true);
        voucher.setNewCustomerOnly(false);
        return voucher;
    }
}
