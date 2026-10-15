package com.app;
import com.app.features.auth.entity.Permission;
import com.app.features.auth.entity.Role;
import com.app.features.auth.entity.RolePermissionAssignment;
import com.app.features.auth.entity.RolePermissionId;
import com.app.features.auth.entity.UserRoleAssignment;
import com.app.features.auth.entity.UserRoleId;
import com.app.features.auth.repository.PermissionRepository;
import com.app.features.auth.repository.RolePermissionAssignmentRepository;
import com.app.features.auth.repository.RoleRepository;
import com.app.features.auth.repository.UserRoleAssignmentRepository;
import com.app.features.cart.repository.CartRepository;
import com.app.features.orders.repository.OrderStatusHistoryRepository;
import com.app.features.user.entity.Address;
import com.app.features.user.repository.AddressRepository;

import com.app.features.auth.entity.UserAccount;
import com.app.features.shipping.entity.ShippingZone;
import com.app.features.shipping.repository.ShippingZoneRepository;
import com.app.features.auth.repository.UserRepository;
import com.app.features.catalog.entity.Category;
import com.app.features.catalog.repository.CategoryRepository;
import com.app.features.orders.repository.OrderRepository;
import com.app.features.products.entity.Product;
import com.app.features.products.repository.ProductRepository;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.suppliers.repository.SupplierRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:cleanmarket;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.auth.email-verification-required=false",
    "app.mail.delivery-enabled=false"
})
@AutoConfigureMockMvc
class MarketplaceFlowTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired SupplierRepository suppliers;
    @Autowired CategoryRepository categories;
    @Autowired ProductRepository products;
    @Autowired OrderRepository orders;
    @Autowired PasswordEncoder encoder;
    @Autowired CartRepository carts;
    @Autowired OrderStatusHistoryRepository history;
    @Autowired RoleRepository roles;
    @Autowired PermissionRepository permissions;
    @Autowired UserRoleAssignmentRepository userRoles;
    @Autowired RolePermissionAssignmentRepository rolePermissions;
    @Autowired AddressRepository addresses;
    @Autowired ShippingZoneRepository shippingZones;

    @Test void rootRedirectsToFrontend() throws Exception {
        mvc.perform(get("/"))
            .andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrl("http://localhost:5173"));
    }

    @Test void checkoutGroupsSuppliersAndRejectsVnpay() throws Exception {
        ShippingZone zone=new ShippingZone();zone.setZoneCode("TEST_HANOI");zone.setZoneName("Hà Nội");zone.setAddressKeywords("Hanoi,Hà Nội");zone.setShippingFee(new BigDecimal("15000"));zone.setFreeShippingThreshold(BigDecimal.ONE);shippingZones.save(zone);
        Category category = new Category(); category.setName("Vegetables"); categories.save(category);
        Product a = product("Carrot", "25000", "Farm A", category);
        Product b = product("Tomato", "40000", "Farm B", category);
        String email = "buyer@example.test";
        var registered = mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"fullName\":\"Buyer\",\"email\":\"" + email + "\",\"password\":\"secure-pass-123\"}")).andExpect(status().isOk()).andReturn();
        MockHttpSession session = (MockHttpSession) registered.getRequest().getSession(false);
        assertNotNull(session);
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
        mvc.perform(get("/api/admin/users").session(session)).andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        mvc.perform(post("/api/cart/items").session(session)).andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("CSRF_INVALID"));
        mvc.perform(get("/api/categories")).andExpect(status().isOk());
        mvc.perform(get("/api/products")).andExpect(status().isOk());
        mvc.perform(get("/api/suppliers")).andExpect(status().isOk());
        mvc.perform(get("/api/users/me").session(session)).andExpect(status().isOk());
        add(session, a.getId(), "2"); add(session, b.getId(), "1");
        assertTrue(carts.findByUserId(users.findByEmailIgnoreCase(email).orElseThrow().getId()).isPresent());
        JsonNode cod = checkout(session, "COD");
        assertEquals(90000, cod.path("data").path("totalAmount").asInt());
        assertEquals(2, cod.path("data").path("supplierOrders").size());
        long codId = cod.path("data").path("id").asLong();
        assertEquals("CREATED", history.findByOrderIdOrderByCreatedAtAsc(codId).get(0).getStatus());
        assertEquals(0, orders.findById(codId).orElseThrow().getSubtotal().compareTo(new BigDecimal("90000")));
        assertEquals(8, products.findById(a.getId()).orElseThrow().getStock().intValue());
        mvc.perform(post("/api/orders/checkout").with(csrf()).session(session).contentType(MediaType.APPLICATION_JSON).content("{\"fullName\":\"Buyer\",\"phone\":\"0912345678\",\"address\":\"Hanoi\",\"paymentMethod\":\"VNPAY\"}")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_PAYMENT_METHOD"));
        int availableBeforeCancel = products.findById(a.getId()).orElseThrow().getStock().intValue();
        add(session, a.getId(), "1");
        JsonNode cancellable = checkout(session, "COD");
        long cancelId = cancellable.path("data").path("id").asLong();
        assertEquals(availableBeforeCancel - 1, products.findById(a.getId()).orElseThrow().getStock().intValue());
        mvc.perform(post("/api/orders/" + cancelId + "/cancel").with(csrf()).session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("CANCELLED"));
        assertEquals(availableBeforeCancel, products.findById(a.getId()).orElseThrow().getStock().intValue());
        assertEquals("CANCELLED", history.findByOrderIdOrderByCreatedAtAsc(cancelId).get(1).getStatus());        var partnerLogin = mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"farma@example.test\",\"password\":\"secure-pass-123\"}")).andExpect(status().isOk()).andReturn();
        MockHttpSession partnerSession = (MockHttpSession) partnerLogin.getRequest().getSession(false);
        mvc.perform(get("/api/partner/products").session(partnerSession)).andExpect(status().isOk());
        LocalDate today = LocalDate.now();
        String batchJson = "{\"farmName\":\"Farm A\",\"origin\":\"Vietnam\",\"harvestDate\":\"" + today.minusDays(2)
            + "\",\"packagingDate\":\"" + today.minusDays(1) + "\",\"expiryDate\":\"" + today.plusDays(30) + "\",\"quantity\":5}";
        mvc.perform(post("/api/partner/products/" + b.getId() + "/batches").with(csrf()).session(partnerSession).contentType(MediaType.APPLICATION_JSON).content(batchJson)).andExpect(status().isForbidden());
        JsonNode batch = body(mvc.perform(post("/api/partner/products/" + a.getId() + "/batches").with(csrf()).session(partnerSession).contentType(MediaType.APPLICATION_JSON).content(batchJson)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        mvc.perform(get("/api/trace/" + batch.path("data").path("traceCode").asText())).andExpect(status().isOk()).andExpect(jsonPath("$.data.productName").value("Carrot"));
        mvc.perform(get("/api/products/" + a.getId())).andExpect(status().isOk()).andExpect(jsonPath("$.data.batch.traceCode").value(batch.path("data").path("traceCode").asText())).andExpect(jsonPath("$.data.batch.farmName").value("Farm A"));
    }

    @Test void sessionLoginRotatesSessionAndLogoutClearsAuthentication() throws Exception {
        var csrfResult = mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
        MockHttpSession session = (MockHttpSession) csrfResult.getRequest().getSession(false);
        String originalSessionId = session.getId();
        String csrfToken = body(csrfResult.getResponse().getContentAsString()).path("data").path("token").asText();
        mvc.perform(post("/api/auth/register").session(session).header("X-CSRF-TOKEN", csrfToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Session User\",\"email\":\"session@example.test\",\"password\":\"secure-pass-123\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.accessToken").doesNotExist());
        assertNotEquals(originalSessionId, session.getId());
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.email").value("session@example.test"));
        mvc.perform(post("/api/auth/logout").session(session).header("X-CSRF-TOKEN", csrfToken)).andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("CSRF_INVALID"));
        String refreshedToken = body(mvc.perform(get("/api/auth/csrf").session(session)).andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString()).path("data").path("token").asText();
        mvc.perform(post("/api/auth/logout").session(session).header("X-CSRF-TOKEN", refreshedToken)).andExpect(status().isNoContent());
        assertTrue(session.isInvalid());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
    }

    @Test void roleAssignmentsAndAddressesPersist() {
        UserAccount account = new UserAccount();
        account.setEmail("mapping@example.test");
        account.setFullName("Mapping Test");
        account.setPasswordHash(encoder.encode("secure-pass-123"));
        users.saveAndFlush(account);

        Role role = new Role();
        role.setName("MAPPING_TEST_ROLE");
        roles.saveAndFlush(role);

        Permission permission = new Permission();
        permission.setCode("mapping:test");
        permissions.saveAndFlush(permission);

        UserRoleAssignment userRole = new UserRoleAssignment();
        userRole.setId(new UserRoleId(account.getId(), role.getId()));
        userRole.setUser(account);
        userRole.setRole(role);
        userRoles.saveAndFlush(userRole);

        RolePermissionAssignment rolePermission = new RolePermissionAssignment();
        rolePermission.setId(new RolePermissionId(role.getId(), permission.getId()));
        rolePermission.setRole(role);
        rolePermission.setPermission(permission);
        rolePermissions.saveAndFlush(rolePermission);

        Address address = new Address();
        address.setUser(account);
        address.setRecipientName("Mapping Test");
        address.setPhone("0912345678");
        address.setAddressLine("Hanoi");
        address.setDefaultAddress(true);
        addresses.saveAndFlush(address);

        assertTrue(userRoles.existsById(new UserRoleId(account.getId(), role.getId())));
        assertTrue(rolePermissions.existsById(new RolePermissionId(role.getId(), permission.getId())));
        assertEquals(1, addresses.findByUserIdOrderByDefaultAddressDesc(account.getId()).size());
    }
    private Product product(String name, String price, String supplierName, Category category) {
        UserAccount owner = new UserAccount(); owner.setFullName(supplierName); owner.setEmail(supplierName.replace(" ", "").toLowerCase() + "@example.test"); owner.setPasswordHash(encoder.encode("secure-pass-123")); owner.setRole("PARTNER"); users.save(owner);
        Supplier supplier = new Supplier(); supplier.setOwner(owner); supplier.setName(supplierName); supplier.setLocation("Vietnam"); supplier.setStatus("APPROVED"); suppliers.save(supplier);
        Product product = new Product(); product.setName(name); product.setSupplier(supplier); product.setCategory(category); product.setPrice(new BigDecimal(price)); product.setUnit("kg"); product.setStock(BigDecimal.TEN); product.setApprovalStatus("APPROVED"); product.setStatus("ACTIVE"); return products.save(product);
    }
    private void add(MockHttpSession session, Long id, String quantity) throws Exception { mvc.perform(post("/api/cart/items").with(csrf()).session(session).contentType(MediaType.APPLICATION_JSON).content("{\"productId\":" + id + ",\"quantity\":" + quantity + "}")).andExpect(status().isOk()); }
    private JsonNode checkout(MockHttpSession session, String method) throws Exception { return body(mvc.perform(post("/api/orders/checkout").with(csrf()).session(session).contentType(MediaType.APPLICATION_JSON).content("{\"fullName\":\"Buyer\",\"phone\":\"0912345678\",\"address\":\"Hanoi\",\"paymentMethod\":\"" + method + "\"}")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()); }
    private JsonNode body(String content) throws Exception { return json.readTree(content); }
}

