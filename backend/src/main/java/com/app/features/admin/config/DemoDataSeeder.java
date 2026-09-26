package com.app.features.admin.config;

import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.repository.UserRepository;
import com.app.features.catalog.entity.Category;
import com.app.features.catalog.repository.CategoryRepository;
import com.app.features.products.entity.Product;
import com.app.features.products.repository.ProductRepository;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.suppliers.repository.SupplierRepository;
import com.app.features.traceability.entity.ProductBatch;
import com.app.features.traceability.repository.BatchRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration @ConditionalOnProperty(name = "app.demo.seed", havingValue = "true")
public class DemoDataSeeder {
    @Bean CommandLineRunner demoData(UserRepository users, SupplierRepository suppliers, CategoryRepository categories, ProductRepository products, BatchRepository batches, PasswordEncoder passwords, @Value("${DEMO_PASSWORD:}") String password) {
        return args -> {
            if (password.length() < 8) throw new IllegalStateException("DEMO_PASSWORD must contain at least 8 characters when DEMO_SEED=true");
            account(users, passwords, "user@cleanmarket.vn", "Khách hàng Demo", "USER", password);
            UserAccount partner = account(users, passwords, "partner@cleanmarket.vn", "Nông trại Mùa Xanh", "PARTNER", password);
            account(users, passwords, "manager@cleanmarket.vn", "Quản lý Demo", "MANAGER", password);
            account(users, passwords, "admin@cleanmarket.vn", "Quản trị Demo", "ADMIN", password);
            Supplier supplier = suppliers.findByOwnerId(partner.getId()).orElseGet(() -> {
                Supplier s = new Supplier(); s.setOwner(partner); s.setName("Nông trại Mùa Xanh"); s.setLocation("Lâm Đồng"); s.setDescription("Nông sản sạch từ trang trại."); s.setStatus("APPROVED"); return suppliers.save(s);
            });
            if (products.findBySupplierId(supplier.getId()).isEmpty()) {
                Category category = categories.findByNameIgnoreCase("Rau lá").orElseGet(() -> { Category c = new Category(); c.setName("Rau lá"); return categories.save(c); });
                Product p = new Product(); p.setSupplier(supplier); p.setCategory(category); p.setName("Rau cải sạch"); p.setDescription("Rau cải thu hoạch tại Lâm Đồng"); p.setPrice(new BigDecimal("15000")); p.setUnit("bó"); p.setStock(new BigDecimal("50")); p.setApprovalStatus("APPROVED"); p.setStatus("ACTIVE"); p.setCertificateNo("VG-DEMO-001"); products.save(p);
                ProductBatch b = new ProductBatch(); b.setProduct(p); b.setBatchCode("CM-DEMO-001"); b.setTraceCode(UUID.randomUUID().toString().replace("-", "")); b.setFarmName(supplier.getName()); b.setOrigin(supplier.getLocation()); b.setHarvestDate(LocalDate.now().minusDays(1)); b.setPackagingDate(LocalDate.now()); b.setExpiryDate(LocalDate.now().plusDays(5)); b.setQuantity(new BigDecimal("50")); b.setCertificateNo(p.getCertificateNo()); batches.save(b);
            }
        };
    }
    private UserAccount account(UserRepository users, PasswordEncoder passwords, String email, String name, String role, String password) {
        return users.findByEmailIgnoreCase(email).orElseGet(() -> { UserAccount user = new UserAccount(); user.setEmail(email); user.setFullName(name); user.setRole(role); user.setPasswordHash(passwords.encode(password)); return users.save(user); });
    }
}
