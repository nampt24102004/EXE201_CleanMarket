package com.app;

import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.repository.UserRepository;
import com.app.features.catalog.entity.Category;
import com.app.features.catalog.repository.CategoryRepository;
import com.app.features.products.entity.Product;
import com.app.features.products.repository.ProductRepository;
import com.app.features.shipping.entity.ShippingZone;
import com.app.features.shipping.repository.ShippingZoneRepository;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.suppliers.repository.SupplierRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:cleanmarket_admin;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.auth.email-verification-required=false",
    "app.mail.delivery-enabled=false"
})
@AutoConfigureMockMvc
class AdminApiTest {
    static final String PASSWORD = "secure-pass-123";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired CategoryRepository categories;
    @Autowired SupplierRepository suppliers;
    @Autowired ProductRepository products;
    @Autowired ShippingZoneRepository zones;

    String tag;
    MockHttpSession admin;

    @BeforeEach void setUp() throws Exception {
        tag = UUID.randomUUID().toString().substring(0, 8);
        account("admin-" + tag, "ADMIN");
        admin = login("admin-" + tag);
    }

    @Test void lockingAUserRevokesTheirSessionAndBlocksLogin() throws Exception {
        UserAccount buyer = account("buyer-" + tag, "USER");
        MockHttpSession session = login("buyer-" + tag);
        mvc.perform(get("/api/users/me").session(session)).andExpect(status().isOk());

        put(admin, "/api/admin/users/" + buyer.getId() + "/status", "{\"enabled\":false}").andExpect(status().isOk())
            .andExpect(jsonPath("$.data.locked").value(true)).andExpect(jsonPath("$.data.enabled").value(false));
        mvc.perform(get("/api/users/me").session(session)).andExpect(status().is4xxClientError());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"buyer-" + tag + "@example.test\",\"password\":\"" + PASSWORD + "\"}"))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
        // The OTP flow must not be a way around the lock.
        mvc.perform(post("/api/auth/email/resend").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"buyer-" + tag + "@example.test\"}"))
            .andExpect(status().is4xxClientError());

        put(admin, "/api/admin/users/" + buyer.getId() + "/status", "{\"enabled\":true}").andExpect(status().isOk());
        mvc.perform(get("/api/users/me").session(login("buyer-" + tag))).andExpect(status().isOk());
    }

    @Test void createdStaffLosesAccessAsSoonAsRoleIsRemoved() throws Exception {
        String body = "{\"email\":\"mgr-" + tag + "@example.test\",\"fullName\":\"Manager\",\"password\":\"" + PASSWORD + "\",\"role\":\"MANAGER\"}";
        JsonNode created = body(mvc.perform(post("/api/admin/users").with(csrf()).session(admin).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk()));
        long id = created.path("data").path("id").asLong();
        mvc.perform(post("/api/admin/users").with(csrf()).session(admin).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isConflict());
        mvc.perform(post("/api/admin/users").with(csrf()).session(admin).contentType(MediaType.APPLICATION_JSON)
            .content(body.replace("mgr-", "other-").replace("MANAGER", "USER"))).andExpect(status().isBadRequest());

        MockHttpSession manager = login("mgr-" + tag);
        mvc.perform(get("/api/manager/orders").session(manager)).andExpect(status().isOk());
        put(admin, "/api/admin/users/" + id + "/role", "{\"role\":\"USER\"}").andExpect(status().isOk());
        mvc.perform(get("/api/manager/orders").session(manager)).andExpect(status().isForbidden());
    }

    @Test void partnerRoleOnlyComesFromAnApprovedSupplierProfile() throws Exception {
        UserAccount buyer = account("nofarm-" + tag, "USER");
        put(admin, "/api/admin/users/" + buyer.getId() + "/role", "{\"role\":\"PARTNER\"}")
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("PARTNER_REQUIRES_SUPPLIER"));
        assertEquals("USER", users.findById(buyer.getId()).orElseThrow().getRole());
    }

    @Test void userSearchFiltersAndPaginates() throws Exception {
        account("findme1-" + tag, "USER"); account("findme2-" + tag, "USER");
        mvc.perform(get("/api/admin/users").param("q", "findme").param("size", "1").session(admin)).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.items.length()").value(1)).andExpect(jsonPath("$.data.size").value(1));
        JsonNode all = body(mvc.perform(get("/api/admin/users").param("q", "findme1-" + tag).session(admin)).andExpect(status().isOk()));
        assertEquals(1, all.path("data").path("total").asLong());
        long id = all.path("data").path("items").get(0).path("id").asLong();
        mvc.perform(get("/api/admin/users/" + id).session(admin)).andExpect(status().isOk()).andExpect(jsonPath("$.data.orderCount").value(0));
        mvc.perform(get("/api/admin/users").param("status", "BOGUS").session(admin)).andExpect(status().isBadRequest());
    }

    @Test void managerCanInspectAndCancelAnOrderAndStockReturns() throws Exception {
        Product carrot = seedProduct();
        account("shopper-" + tag, "USER");
        MockHttpSession shopper = login("shopper-" + tag);
        mvc.perform(post("/api/cart/items").with(csrf()).session(shopper).contentType(MediaType.APPLICATION_JSON).content("{\"productId\":" + carrot.getId() + ",\"quantity\":3}")).andExpect(status().isOk());
        JsonNode order = body(mvc.perform(post("/api/orders/checkout").with(csrf()).session(shopper).contentType(MediaType.APPLICATION_JSON)
            .content("{\"fullName\":\"Shopper\",\"phone\":\"0912345678\",\"address\":\"Hanoi\",\"paymentMethod\":\"COD\"}")).andExpect(status().isOk()));
        long orderId = order.path("data").path("id").asLong();
        String code = order.path("data").path("orderCode").asText();
        assertEquals(7, products.findById(carrot.getId()).orElseThrow().getStock().intValue());

        mvc.perform(get("/api/manager/orders").param("q", code).session(admin)).andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(1));
        mvc.perform(get("/api/manager/orders/" + orderId).session(admin)).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.customerEmail").value("shopper-" + tag + "@example.test"))
            .andExpect(jsonPath("$.data.payments[0].provider").value("COD"))
            .andExpect(jsonPath("$.data.history[0].status").value("CREATED"));

        put(admin, "/api/manager/orders/" + orderId + "/cancel", "{\"reason\":\"\"}").andExpect(status().isBadRequest());
        put(admin, "/api/manager/orders/" + orderId + "/cancel", "{\"reason\":\"Hết hàng tại kho\"}").andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("CANCELLED"));
        put(admin, "/api/manager/orders/" + orderId + "/cancel", "{\"reason\":\"again\"}").andExpect(status().isConflict());
        assertEquals(10, products.findById(carrot.getId()).orElseThrow().getStock().intValue());
        mvc.perform(get("/api/admin/audit-logs").param("action", "ORDER_CANCEL_BY_STAFF").param("entityId", String.valueOf(orderId)).session(admin))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(1));
    }

    @Test void orderStatusFollowsSupplierProgressAndShippedOrdersCannotBeCancelled() throws Exception {
        Product carrot = seedProduct();
        account("buyer2-" + tag, "USER");
        MockHttpSession buyer = login("buyer2-" + tag);
        mvc.perform(post("/api/cart/items").with(csrf()).session(buyer).contentType(MediaType.APPLICATION_JSON).content("{\"productId\":" + carrot.getId() + ",\"quantity\":1}")).andExpect(status().isOk());
        JsonNode order = body(mvc.perform(post("/api/orders/checkout").with(csrf()).session(buyer).contentType(MediaType.APPLICATION_JSON)
            .content("{\"fullName\":\"Buyer\",\"phone\":\"0912345678\",\"address\":\"Hanoi\",\"paymentMethod\":\"COD\"}")).andExpect(status().isOk()));
        long orderId = order.path("data").path("id").asLong();
        long partId = order.path("data").path("supplierOrders").get(0).path("id").asLong();

        MockHttpSession farm = login("farm-" + tag);
        put(farm, "/api/partner/orders/" + partId + "/status", "{\"status\":\"CONFIRMED\"}").andExpect(status().isOk());
        mvc.perform(get("/api/manager/orders/" + orderId).session(admin)).andExpect(jsonPath("$.data.order.status").value("CONFIRMED"));
        put(farm, "/api/partner/orders/" + partId + "/status", "{\"status\":\"SHIPPED\"}").andExpect(status().isOk());
        mvc.perform(get("/api/manager/orders/" + orderId).session(admin)).andExpect(jsonPath("$.data.order.status").value("SHIPPED"))
            .andExpect(jsonPath("$.data.history[-1].status").value("SHIPPED"));
        put(admin, "/api/manager/orders/" + orderId + "/cancel", "{\"reason\":\"thử\"}").andExpect(status().isConflict());
        put(farm, "/api/partner/orders/" + partId + "/status", "{\"status\":\"DELIVERED\"}").andExpect(status().isOk());
        mvc.perform(get("/api/manager/orders/" + orderId).session(admin)).andExpect(jsonPath("$.data.order.status").value("DELIVERED"))
            .andExpect(jsonPath("$.data.payments[0].status").value("PAID"));
    }

    @Test void partnerSeesPaidOrdersWithDeliveryInfoAndIsNotified() throws Exception {
        Product carrot = seedProduct();
        account("buyer3-" + tag, "USER");
        MockHttpSession buyer = login("buyer3-" + tag);
        String checkout = "{\"fullName\":\"Chị Lan\",\"phone\":\"0912345678\",\"address\":\"Hanoi\",\"note\":\"Gọi trước\",\"paymentMethod\":\"%s\"}";
        mvc.perform(post("/api/cart/items").with(csrf()).session(buyer).contentType(MediaType.APPLICATION_JSON).content("{\"productId\":" + carrot.getId() + ",\"quantity\":1}")).andExpect(status().isOk());
        mvc.perform(post("/api/orders/checkout").with(csrf()).session(buyer).contentType(MediaType.APPLICATION_JSON).content(checkout.formatted("COD"))).andExpect(status().isOk());
        mvc.perform(post("/api/cart/items").with(csrf()).session(buyer).contentType(MediaType.APPLICATION_JSON).content("{\"productId\":" + carrot.getId() + ",\"quantity\":1}")).andExpect(status().isOk());
        mvc.perform(post("/api/orders/checkout").with(csrf()).session(buyer).contentType(MediaType.APPLICATION_JSON).content(checkout.formatted("PAYOS"))).andExpect(status().isOk());

        MockHttpSession farm = login("farm-" + tag);
        // The unpaid payOS order stays hidden until asked for; the COD one carries what the farm needs to deliver.
        mvc.perform(get("/api/partner/orders").session(farm)).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].paymentMethod").value("COD"))
            .andExpect(jsonPath("$.data[0].paymentStatus").value("PENDING"))
            .andExpect(jsonPath("$.data[0].recipientName").value("Chị Lan"))
            .andExpect(jsonPath("$.data[0].note").value("Gọi trước"));
        mvc.perform(get("/api/partner/orders").param("includeUnpaid", "true").session(farm)).andExpect(jsonPath("$.data.length()").value(2));
        mvc.perform(get("/api/notifications").session(farm)).andExpect(jsonPath("$.data.unread").value(1))
            .andExpect(jsonPath("$.data.items[0].title").value(org.hamcrest.Matchers.startsWith("Đơn hàng mới")));
    }

    @Test void dashboardAndReportsRespond() throws Exception {
        mvc.perform(get("/api/admin/dashboard/summary").session(admin)).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalUsers").isNumber()).andExpect(jsonPath("$.data.ordersByStatus").isMap());
        mvc.perform(get("/api/manager/complaints").session(admin)).andExpect(status().isOk());
        mvc.perform(get("/api/admin/reports/revenue").session(admin)).andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(30));
        mvc.perform(get("/api/admin/reports/revenue").param("from", "2026-01-01").param("to", "2026-03-31").param("groupBy", "month").session(admin))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(3));
        mvc.perform(get("/api/admin/reports/revenue").param("groupBy", "week").session(admin)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/admin/reports/top-products").session(admin)).andExpect(status().isOk());
        mvc.perform(get("/api/admin/reports/top-suppliers").param("limit", "5").session(admin)).andExpect(status().isOk());
        mvc.perform(get("/api/admin/payments").param("stale", "true").session(admin)).andExpect(status().isOk()).andExpect(jsonPath("$.data.items").isArray());
    }

    @Test void categoriesAndSettingsCanBeEdited() throws Exception {
        JsonNode created = body(mvc.perform(post("/api/admin/categories").with(csrf()).session(admin).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Rau " + tag + "\"}")).andExpect(status().isOk()));
        mvc.perform(post("/api/admin/categories").with(csrf()).session(admin).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Quả " + tag + "\"}")).andExpect(status().isOk());
        long id = created.path("data").path("id").asLong();
        put(admin, "/api/admin/categories/" + id, "{\"name\":\"Rau củ " + tag + "\"}").andExpect(status().isOk()).andExpect(jsonPath("$.data.name").value("Rau củ " + tag));
        put(admin, "/api/admin/categories/" + id, "{\"name\":\"Quả " + tag + "\"}").andExpect(status().isConflict());

        put(admin, "/api/admin/settings/support.email", "{\"value\":\"help@example.test\",\"description\":\"Email hỗ trợ\"}").andExpect(status().isOk());
        put(admin, "/api/admin/settings/Bad Key", "{\"value\":\"x\"}").andExpect(status().isBadRequest());
        mvc.perform(get("/api/admin/settings").session(admin)).andExpect(status().isOk()).andExpect(jsonPath("$.data[?(@.key=='support.email')].value").value("help@example.test"));
    }

    @Test void nonAdminsCannotUseAdminApis() throws Exception {
        account("plain-" + tag, "USER");
        MockHttpSession plain = login("plain-" + tag);
        mvc.perform(get("/api/admin/dashboard/summary").session(plain)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/payments").session(plain)).andExpect(status().isForbidden());
        mvc.perform(get("/api/manager/orders/1").session(plain)).andExpect(status().isForbidden());
    }

    private UserAccount account(String name, String role) {
        UserAccount u = new UserAccount(); u.setEmail(name + "@example.test"); u.setFullName(name); u.setPasswordHash(encoder.encode(PASSWORD)); u.setRole(role); return users.save(u);
    }
    private Product seedProduct() {
        ShippingZone zone = new ShippingZone(); zone.setZoneCode("Z" + tag); zone.setZoneName("Hà Nội " + tag); zone.setAddressKeywords("Hanoi"); zone.setShippingFee(BigDecimal.ZERO); zones.save(zone);
        Category category = new Category(); category.setName("Cat " + tag); categories.save(category);
        UserAccount owner = account("farm-" + tag, "PARTNER");
        Supplier supplier = new Supplier(); supplier.setOwner(owner); supplier.setName("Farm " + tag); supplier.setLocation("Vietnam"); supplier.setStatus("APPROVED"); suppliers.save(supplier);
        Product p = new Product(); p.setName("Carrot " + tag); p.setSupplier(supplier); p.setCategory(category); p.setPrice(new BigDecimal("20000")); p.setUnit("kg");
        p.setStock(BigDecimal.TEN); p.setApprovalStatus("APPROVED"); p.setStatus("ACTIVE"); return products.save(p);
    }
    private MockHttpSession login(String name) throws Exception {
        return (MockHttpSession) mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + name + "@example.test\",\"password\":\"" + PASSWORD + "\"}")).andExpect(status().isOk()).andReturn().getRequest().getSession(false);
    }
    private ResultActions put(MockHttpSession session, String url, String content) throws Exception {
        return mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(url).with(csrf()).session(session).contentType(MediaType.APPLICATION_JSON).content(content));
    }
    private JsonNode body(ResultActions result) throws Exception { return json.readTree(result.andReturn().getResponse().getContentAsString()); }
}
