package com.app;

import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.repository.UserRepository;
import com.app.features.catalog.entity.Category;
import com.app.features.catalog.repository.CategoryRepository;
import com.app.features.notifications.repository.NotificationRepository;
import com.app.features.orders.config.UnpaidOrderSweeper;
import com.app.features.orders.repository.OrderRepository;
import com.app.features.products.entity.Product;
import com.app.features.products.repository.ProductRepository;
import com.app.features.shipping.entity.ShippingZone;
import com.app.features.shipping.repository.ShippingZoneRepository;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.suppliers.repository.SupplierRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:operations_flow;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.auth.email-verification-required=false",
    "app.mail.delivery-enabled=false"
})
@AutoConfigureMockMvc
class OperationsFlowTest {
    static final String PASSWORD = "secure-pass-123";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired CategoryRepository categories;
    @Autowired SupplierRepository suppliers;
    @Autowired ProductRepository products;
    @Autowired ShippingZoneRepository zones;
    @Autowired OrderRepository orders;
    @Autowired NotificationRepository notifications;
    @Autowired UnpaidOrderSweeper sweeper;
    @Autowired JdbcTemplate jdbc;

    String tag; Product product; Supplier supplier; Category category; UserAccount buyer; MockHttpSession buyerSession;

    @BeforeEach void setUp() throws Exception {
        tag = UUID.randomUUID().toString().substring(0, 8);
        ShippingZone zone = new ShippingZone(); zone.setZoneCode("Z" + tag); zone.setZoneName("HN " + tag); zone.setAddressKeywords("Hanoi"); zone.setShippingFee(BigDecimal.ZERO); zones.save(zone);
        category = new Category(); category.setName("Cat " + tag); categories.save(category);
        supplier = new Supplier(); supplier.setOwner(account("farm-" + tag, "PARTNER")); supplier.setName("Farm " + tag); supplier.setLocation("VN"); supplier.setStatus("APPROVED"); suppliers.save(supplier);
        product = new Product(); product.setName("Cải " + tag); product.setSupplier(supplier); product.setCategory(category); product.setPrice(new BigDecimal("10000"));
        product.setUnit("kg"); product.setStock(BigDecimal.TEN); product.setApprovalStatus("APPROVED"); product.setStatus("ACTIVE"); products.save(product);
        buyer = account("buyer-" + tag, "USER");
        buyerSession = login("buyer-" + tag);
    }

    @Test void abandonedPayOSOrderIsCancelledAndStockReturned() throws Exception {
        long orderId = order("PAYOS", 3);
        assertEquals(7, stock());
        jdbc.update("update orders set created_at = ? where id = ?", Timestamp.from(Instant.now().minusSeconds(3600)), orderId);
        jdbc.update("update payments set created_at = ? where order_id = ?", Timestamp.from(Instant.now().minusSeconds(3600)), orderId);
        assertEquals(1, sweeper.sweepNow());
        assertEquals("CANCELLED", orders.findById(orderId).orElseThrow().getStatus());
        assertEquals(10, stock());
        assertTrue(notifications.findByRecipientIdOrderByCreatedAtDesc(buyer.getId()).stream().anyMatch(n -> n.getTitle().contains("đã bị hủy")));
        // A fresh unpaid order is left alone.
        order("PAYOS", 1);
        assertEquals(0, sweeper.sweepNow());
    }

    @Test void approvedProductCanBePausedAndEditingSendsItBackForReview() throws Exception {
        MockHttpSession farm = login("farm-" + tag);
        put(farm, "/api/partner/products/" + product.getId() + "/availability", "{\"active\":false}").andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("INACTIVE"));
        mvc.perform(get("/api/products/" + product.getId())).andExpect(status().isNotFound());
        put(farm, "/api/partner/products/" + product.getId() + "/availability", "{\"active\":true}").andExpect(status().isOk());
        mvc.perform(get("/api/products/" + product.getId())).andExpect(status().isOk());

        String edit = "{\"name\":\"Cải mới\",\"description\":\"x\",\"price\":12000,\"unit\":\"kg\",\"categoryId\":" + category.getId() + ",\"stock\":10,\"origin\":\"HN\"}";
        put(farm, "/api/partner/products/" + product.getId(), edit).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.approvalStatus").value("DRAFT")).andExpect(jsonPath("$.data.status").value("INACTIVE"));
        mvc.perform(get("/api/products/" + product.getId())).andExpect(status().isNotFound());
    }

    @Test void suspendedSupplierFinishesAcceptedOrdersAndBuyerHearsAboutEachStep() throws Exception {
        long orderId = order("COD", 1);
        long partId = json.readTree(mvc.perform(get("/api/orders/" + orderId).session(buyerSession)).andReturn().getResponse().getContentAsString())
            .path("data").path("supplierOrders").get(0).path("id").asLong();
        supplier.setStatus("SUSPENDED"); suppliers.save(supplier);
        MockHttpSession farm = login("farm-" + tag);
        for (String step : new String[] {"CONFIRMED", "SHIPPED", "DELIVERED"})
            put(farm, "/api/partner/orders/" + partId + "/status", "{\"status\":\"" + step + "\"}").andExpect(status().isOk());
        var titles = notifications.findByRecipientIdOrderByCreatedAtDesc(buyer.getId()).stream().map(n -> n.getTitle()).toList();
        assertTrue(titles.stream().anyMatch(t -> t.contains("đã được xác nhận")));
        assertTrue(titles.stream().anyMatch(t -> t.contains("đang được giao")));
        assertTrue(titles.stream().anyMatch(t -> t.contains("đã giao thành công")));
    }

    @Test void complaintTargetsOneSupplierAndAdminCanHandleIt() throws Exception {
        long orderId = order("COD", 1);
        long partId = json.readTree(mvc.perform(get("/api/orders/" + orderId).session(buyerSession)).andReturn().getResponse().getContentAsString())
            .path("data").path("supplierOrders").get(0).path("id").asLong();
        JsonNode complaint = json.readTree(mvc.perform(post("/api/complaints").with(csrf()).session(buyerSession).contentType(MediaType.APPLICATION_JSON)
            .content("{\"orderId\":" + orderId + ",\"supplierOrderId\":" + partId + ",\"reason\":\"Hàng dập\",\"description\":\"Rau bị dập\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.supplierName").value("Farm " + tag)).andReturn().getResponse().getContentAsString());
        mvc.perform(get("/api/partner/complaints").session(login("farm-" + tag))).andExpect(jsonPath("$.data[0].reason").value("Hàng dập"));

        account("admin-" + tag, "ADMIN");
        MockHttpSession admin = login("admin-" + tag);
        mvc.perform(get("/api/manager/complaints").session(admin)).andExpect(status().isOk());
        put(admin, "/api/manager/complaints/" + complaint.path("data").path("id").asLong() + "/resolve", "{\"resolution\":\"Đổi hàng mới\"}").andExpect(status().isOk());
        assertTrue(notifications.findByRecipientIdOrderByCreatedAtDesc(buyer.getId()).stream().anyMatch(n -> n.getTitle().contains("đã được xử lý")));
    }

    @Test void refundGoesThroughCustomerBankDetailsAndStaffApproval() throws Exception {
        long orderId = order("COD", 2);
        long partId = json.readTree(mvc.perform(get("/api/orders/" + orderId).session(buyerSession)).andReturn().getResponse().getContentAsString())
            .path("data").path("supplierOrders").get(0).path("id").asLong();
        MockHttpSession farm = login("farm-" + tag);
        for (String step : new String[] {"CONFIRMED", "SHIPPED", "DELIVERED"})
            put(farm, "/api/partner/orders/" + partId + "/status", "{\"status\":\"" + step + "\"}").andExpect(status().isOk());
        long complaintId = json.readTree(mvc.perform(post("/api/complaints").with(csrf()).session(buyerSession).contentType(MediaType.APPLICATION_JSON)
            .content("{\"orderId\":" + orderId + ",\"reason\":\"Hàng hỏng\",\"description\":\"Rau úng\"}")).andReturn().getResponse().getContentAsString()).path("data").path("id").asLong();

        account("staff-" + tag, "MANAGER");
        MockHttpSession staff = login("staff-" + tag);
        long refundId = json.readTree(mvc.perform(post("/api/manager/complaints/" + complaintId + "/refunds").with(csrf()).session(staff).contentType(MediaType.APPLICATION_JSON)
            .content("{\"amount\":20000,\"note\":\"Hoàn toàn bộ\"}")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).path("data").path("id").asLong();
        String base = "/api/manager/refunds/" + refundId;

        // Nothing can be transferred before the customer's account has been checked.
        put(staff, base + "/manual-complete", "{\"providerRef\":\"FT1\"}").andExpect(status().isConflict());
        put(buyerSession, "/api/refunds/" + refundId + "/bank-info", "{\"bankName\":\"VCB\",\"accountNumber\":\"12ab\",\"accountHolder\":\"A\"}").andExpect(status().isBadRequest());
        put(buyerSession, "/api/refunds/" + refundId + "/bank-info", "{\"bankName\":\"VCB\",\"accountNumber\":\"0123456789\",\"accountHolder\":\"nguyen van a\"}")
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("BANK_INFO_SUBMITTED")).andExpect(jsonPath("$.data.bankAccountHolder").value("NGUYEN VAN A"));
        assertTrue(notifications.findByRecipientIdOrderByCreatedAtDesc(users.findByEmailIgnoreCase("staff-" + tag + "@example.test").orElseThrow().getId()).stream().anyMatch(n -> n.getTitle().contains("STK")));

        put(staff, base + "/bank-info/reject", "{\"reason\":\"Sai tên chủ tài khoản\"}").andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("REQUESTED"));
        mvc.perform(get("/api/refunds/my").session(buyerSession)).andExpect(jsonPath("$.data[0].bankReviewNote").value("Sai tên chủ tài khoản"));
        put(buyerSession, "/api/refunds/" + refundId + "/bank-info", "{\"bankName\":\"VCB\",\"accountNumber\":\"0123456789\",\"accountHolder\":\"NGUYEN THI B\"}").andExpect(status().isOk());
        put(staff, base + "/bank-info/approve", "{}").andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("APPROVED"));
        put(buyerSession, "/api/refunds/" + refundId + "/bank-info", "{\"bankName\":\"ACB\",\"accountNumber\":\"999999\",\"accountHolder\":\"X\"}").andExpect(status().isConflict());
        put(staff, base + "/manual-complete", "{\"providerRef\":\"FT26101234\"}").andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("MANUAL_COMPLETED"));

        var titles = notifications.findByRecipientIdOrderByCreatedAtDesc(buyer.getId()).stream().map(n -> n.getTitle()).toList();
        assertTrue(titles.stream().anyMatch(t -> t.contains("được duyệt hoàn tiền")));
        assertTrue(titles.stream().anyMatch(t -> t.contains("Cần cập nhật thông tin")));
        assertTrue(titles.stream().anyMatch(t -> t.contains("Thông tin hoàn tiền đã được duyệt")));
        assertTrue(titles.stream().anyMatch(t -> t.startsWith("Đã hoàn tiền")));
        assertEquals("REFUNDED", jdbc.queryForObject("select status from payments where order_id = ?", String.class, orderId));
    }

    @Autowired com.app.features.feedback.service.LatePaymentRefunds latePayments;
    @Autowired com.app.features.payments.repository.PaymentRepository paymentRepository;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;

    @Test void moneyForACancelledOrderBecomesARefundTheCustomerCanClaim() throws Exception {
        long orderId = order("PAYOS", 1);
        mvc.perform(post("/api/orders/" + orderId + "/cancel").with(csrf()).session(buyerSession)).andExpect(status().isOk());
        account("ops-" + tag, "ADMIN");
        // What the payOS webhook handler does (inside its transaction) once it has verified the late payment.
        new org.springframework.transaction.support.TransactionTemplate(transactionManager).executeWithoutResult(tx -> {
            var payment = paymentRepository.findByOrderIdOrderByCreatedAtDesc(orderId).get(0);
            payment.setStatus("PAID"); payment.setProviderTransactionNo("TXN-LATE-" + tag);
            latePayments.openFor(payment);
        });

        mvc.perform(get("/api/refunds/my").session(buyerSession)).andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].status").value("REQUESTED"))
            .andExpect(jsonPath("$.data[0].amount").value(10000.0));
        assertEquals("CANCELLED", orders.findById(orderId).orElseThrow().getStatus());
        assertTrue(notifications.findByRecipientIdOrderByCreatedAtDesc(buyer.getId()).stream().anyMatch(n -> n.getTitle().contains("đã hủy nhưng bạn đã thanh toán")));
        assertTrue(notifications.findByRecipientIdOrderByCreatedAtDesc(users.findByEmailIgnoreCase("ops-" + tag + "@example.test").orElseThrow().getId())
            .stream().anyMatch(n -> n.getTitle().startsWith("Cần hoàn tiền đơn đã hủy")));
    }

    @Test void accountSelfServiceWorksForEveryRole() throws Exception {
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/me/password").with(csrf()).session(buyerSession).contentType(MediaType.APPLICATION_JSON)
            .content("{\"currentPassword\":\"wrong-pass\",\"newPassword\":\"brand-new-pass\"}")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("WRONG_PASSWORD"));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/me/password").with(csrf()).session(buyerSession).contentType(MediaType.APPLICATION_JSON)
            .content("{\"currentPassword\":\"" + PASSWORD + "\",\"newPassword\":\"brand-new-pass\"}")).andExpect(status().isOk());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"buyer-" + tag + "@example.test\",\"password\":\"brand-new-pass\"}")).andExpect(status().isOk());

        String address = "{\"recipientName\":\"Lan\",\"phone\":\"0912345678\",\"addressLine\":\"Hanoi\",\"defaultAddress\":false}";
        mvc.perform(post("/api/users/me/addresses").with(csrf()).session(buyerSession).contentType(MediaType.APPLICATION_JSON).content(address))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.defaultAddress").value(true));
        mvc.perform(post("/api/users/me/addresses").with(csrf()).session(buyerSession).contentType(MediaType.APPLICATION_JSON).content(address.replace("false", "true").replace("Lan", "Mai")))
            .andExpect(status().isOk());
        mvc.perform(get("/api/users/me/addresses").session(buyerSession)).andExpect(jsonPath("$.data.length()").value(2)).andExpect(jsonPath("$.data[0].recipientName").value("Mai"));

        account("mgr-" + tag, "MANAGER");
        mvc.perform(get("/api/users/me").session(login("mgr-" + tag))).andExpect(status().isOk()).andExpect(jsonPath("$.data.role").value("MANAGER"));
    }

    @Test void disabledCategoryHidesProductsAndRatingsAreShown() throws Exception {
        mvc.perform(get("/api/products/" + product.getId())).andExpect(status().isOk()).andExpect(jsonPath("$.data.reviewCount").value(0));
        category.setActive(false); categories.save(category);
        mvc.perform(get("/api/products/" + product.getId())).andExpect(status().isNotFound());
        mvc.perform(post("/api/cart/items").with(csrf()).session(buyerSession).contentType(MediaType.APPLICATION_JSON).content("{\"productId\":" + product.getId() + ",\"quantity\":1}"))
            .andExpect(status().isBadRequest());
    }

    private long order(String method, int quantity) throws Exception {
        mvc.perform(post("/api/cart/items").with(csrf()).session(buyerSession).contentType(MediaType.APPLICATION_JSON).content("{\"productId\":" + product.getId() + ",\"quantity\":" + quantity + "}")).andExpect(status().isOk());
        return json.readTree(mvc.perform(post("/api/orders/checkout").with(csrf()).session(buyerSession).contentType(MediaType.APPLICATION_JSON)
            .content("{\"fullName\":\"Buyer\",\"phone\":\"0912345678\",\"address\":\"Hanoi\",\"paymentMethod\":\"" + method + "\"}")).andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString()).path("data").path("id").asLong();
    }
    private int stock() { return products.findById(product.getId()).orElseThrow().getStock().intValue(); }
    private UserAccount account(String name, String role) {
        UserAccount u = new UserAccount(); u.setEmail(name + "@example.test"); u.setFullName(name); u.setPasswordHash(encoder.encode(PASSWORD)); u.setRole(role); return users.save(u);
    }
    private MockHttpSession login(String name) throws Exception {
        return (MockHttpSession) mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + name + "@example.test\",\"password\":\"" + PASSWORD + "\"}")).andExpect(status().isOk()).andReturn().getRequest().getSession(false);
    }
    private ResultActions put(MockHttpSession session, String url, String body) throws Exception {
        return mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(url).with(csrf()).session(session).contentType(MediaType.APPLICATION_JSON).content(body));
    }
}
