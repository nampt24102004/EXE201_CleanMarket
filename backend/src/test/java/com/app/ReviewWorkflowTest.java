package com.app;

import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.repository.UserRepository;
import com.app.features.catalog.entity.Category;
import com.app.features.catalog.repository.CategoryRepository;
import com.app.features.notifications.repository.NotificationRepository;
import com.app.features.products.entity.Product;
import com.app.features.products.repository.ProductRepository;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.suppliers.entity.SupplierDocument;
import com.app.features.suppliers.enums.SupplierDocumentStatus;
import com.app.features.suppliers.repository.SupplierDocumentRepository;
import com.app.features.suppliers.repository.SupplierRepository;
import com.app.features.traceability.entity.Certification;
import com.app.features.traceability.enums.CertificationStatus;
import com.app.features.traceability.repository.CertificationRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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
    "spring.datasource.url=jdbc:h2:mem:review_workflow;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.auth.email-verification-required=false",
    "app.mail.delivery-enabled=false"
})
@AutoConfigureMockMvc
class ReviewWorkflowTest {
    static final String PASSWORD = "secure-pass-123";
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired SupplierRepository suppliers;
    @Autowired SupplierDocumentRepository documents;
    @Autowired CategoryRepository categories;
    @Autowired ProductRepository products;
    @Autowired CertificationRepository certifications;
    @Autowired NotificationRepository notifications;

    String tag;
    MockHttpSession manager;

    @BeforeEach void setUp() throws Exception {
        tag = UUID.randomUUID().toString().substring(0, 8);
        account("mgr-" + tag, "MANAGER");
        manager = login("mgr-" + tag);
    }

    @Test void rejectedDocumentIsNeverApprovedByProfileApproval() throws Exception {
        UserAccount owner = account("farm-" + tag, "USER");
        Supplier s = supplier(owner, "PENDING");
        SupplierDocument good = document(s, null), bad = document(s, null);

        put("/api/manager/suppliers/" + s.getId() + "/documents/" + bad.getId() + "/reject", "{\"reason\":\"Ảnh mờ\"}").andExpect(status().isOk());
        put("/api/manager/suppliers/" + s.getId() + "/approve", null).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("DOCUMENT_REJECTED"));
        assertEquals(SupplierDocumentStatus.REJECTED, documents.findById(bad.getId()).orElseThrow().getStatus());

        // The owner withdraws the rejected file, then approval goes through and only the remaining pending document is approved.
        MockHttpSession farmer = login("farm-" + tag);
        mvc.perform(delete("/api/supplier-applications/me/documents/" + bad.getId()).with(csrf()).session(farmer)).andExpect(status().isOk());
        assertFalse(documents.existsById(bad.getId()));
        put("/api/manager/suppliers/" + s.getId() + "/approve", null).andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("APPROVED"));
        assertEquals(SupplierDocumentStatus.APPROVED, documents.findById(good.getId()).orElseThrow().getStatus());

        // Decisions are final once the profile is approved, and the owner was told about each decision.
        put("/api/manager/suppliers/" + s.getId() + "/documents/" + good.getId() + "/reject", "{\"reason\":\"x\"}").andExpect(status().isConflict());
        assertTrue(notifications.findByRecipientIdOrderByCreatedAtDesc(owner.getId()).stream().anyMatch(n -> n.getTitle().contains("bị từ chối")));
        assertTrue(notifications.findByRecipientIdOrderByCreatedAtDesc(owner.getId()).stream().anyMatch(n -> n.getTitle().contains("đã được duyệt")));
        mvc.perform(get("/api/notifications").session(login("farm-" + tag))).andExpect(status().isOk()).andExpect(jsonPath("$.data.unread").value(2));
    }

    @Test void approvedDocumentCannotBeDeletedButResubmitNeedsRejectedOnesRemoved() throws Exception {
        UserAccount owner = account("farm2-" + tag, "USER");
        Supplier s = supplier(owner, "PENDING");
        SupplierDocument ok = document(s, null), bad = document(s, null);
        put("/api/manager/suppliers/" + s.getId() + "/documents/" + ok.getId() + "/approve", null).andExpect(status().isOk());
        put("/api/manager/suppliers/" + s.getId() + "/documents/" + bad.getId() + "/reject", "{\"reason\":\"Sai loại\"}").andExpect(status().isOk());
        put("/api/manager/suppliers/" + s.getId() + "/reject", "{\"reason\":\"Thiếu giấy phép\"}").andExpect(status().isOk());

        MockHttpSession farmer = login("farm2-" + tag);
        mvc.perform(delete("/api/supplier-applications/me/documents/" + ok.getId()).with(csrf()).session(farmer)).andExpect(status().isConflict());
        mvc.perform(post("/api/supplier-applications/me/resubmit").with(csrf()).session(farmer)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("DOCUMENT_REJECTED"));
        mvc.perform(delete("/api/supplier-applications/me/documents/" + bad.getId()).with(csrf()).session(farmer)).andExpect(status().isOk());
        mvc.perform(post("/api/supplier-applications/me/resubmit").with(csrf()).session(farmer)).andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test void expiredDocumentShowsAsExpiredAndBlocksApproval() throws Exception {
        Supplier s = supplier(account("farm3-" + tag, "USER"), "PENDING");
        SupplierDocument old = document(s, LocalDate.now().minusDays(1));
        mvc.perform(get("/api/manager/suppliers/" + s.getId()).session(manager)).andExpect(status().isOk()).andExpect(jsonPath("$.data.documents[0].status").value("EXPIRED"));
        put("/api/manager/suppliers/" + s.getId() + "/documents/" + old.getId() + "/approve", null).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("DOCUMENT_EXPIRED"));
        put("/api/manager/suppliers/" + s.getId() + "/approve", null).andExpect(status().isConflict());
    }

    @Test void productApprovalWaitsForCertificatesAndExpiredOnesAreHidden() throws Exception {
        UserAccount owner = account("farm4-" + tag, "PARTNER");
        Supplier s = supplier(owner, "APPROVED");
        Category category = new Category(); category.setName("Cat " + tag); categories.save(category);
        Product p = new Product(); p.setName("Cải " + tag); p.setSupplier(s); p.setCategory(category); p.setPrice(new BigDecimal("10000")); p.setUnit("kg");
        p.setStock(BigDecimal.TEN); p.setApprovalStatus("PENDING"); p.setStatus("INACTIVE"); products.save(p);
        Certification pending = certificate(p, LocalDate.now().plusYears(1)), expired = certificate(p, LocalDate.now().minusDays(1));

        put("/api/manager/products/" + p.getId() + "/approve", null).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("CERTIFICATE_PENDING"));
        put("/api/manager/products/" + p.getId() + "/certificates/" + expired.getId() + "/approve", null).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("CERTIFICATE_EXPIRED"));
        put("/api/manager/products/" + p.getId() + "/certificates/" + pending.getId() + "/reject", "{\"reason\":\"Sai số\"}").andExpect(status().isOk());
        put("/api/manager/products/" + p.getId() + "/approve", null).andExpect(status().isOk());
        assertTrue(notifications.findByRecipientIdOrderByCreatedAtDesc(owner.getId()).stream().anyMatch(n -> n.getTitle().equals("Sản phẩm đã được duyệt")));

        MockHttpSession partner = login("farm4-" + tag);
        mvc.perform(get("/api/partner/products/" + p.getId()).session(partner)).andExpect(status().isOk());
        mvc.perform(delete("/api/partner/products/" + p.getId() + "/certificates/" + expired.getId()).with(csrf()).session(partner)).andExpect(status().isOk());
        assertFalse(certifications.existsById(expired.getId()));
        assertEquals(CertificationStatus.REJECTED, certifications.findById(pending.getId()).orElseThrow().getStatus());
    }

    private UserAccount account(String name, String role) {
        UserAccount u = new UserAccount(); u.setEmail(name + "@example.test"); u.setFullName(name); u.setPasswordHash(encoder.encode(PASSWORD)); u.setRole(role); return users.save(u);
    }
    private Supplier supplier(UserAccount owner, String status) {
        Supplier s = new Supplier(); s.setOwner(owner); s.setName("Farm " + owner.getFullName()); s.setLocation("Hà Nội"); s.setEmail(owner.getEmail()); s.setPhone("0912345678");
        s.setSupplierType("FARM"); s.setStatus(status); return suppliers.save(s);
    }
    // No objectKey: these records point at a plain URL so the tests never touch object storage.
    private SupplierDocument document(Supplier s, LocalDate expiry) {
        SupplierDocument d = new SupplierDocument(); d.setSupplier(s); d.setType("BUSINESS_LICENSE"); d.setDocumentName("GPKD " + UUID.randomUUID());
        d.setOriginalFileName("gpkd.pdf"); d.setFileUrl("https://example.test/gpkd.pdf"); d.setExpiryDate(expiry); d.setUploadedAt(Instant.now()); return documents.save(d);
    }
    private Certification certificate(Product p, LocalDate expiry) {
        Certification c = new Certification(); c.setProduct(p); c.setType("VIETGAP"); c.setCertificateNo("VG-" + UUID.randomUUID().toString().substring(0, 6)); c.setIssuer("Sở NN");
        c.setFileUrl("https://example.test/vg.pdf"); c.setExpiryAt(expiry); return certifications.save(c);
    }
    private MockHttpSession login(String name) throws Exception {
        return (MockHttpSession) mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + name + "@example.test\",\"password\":\"" + PASSWORD + "\"}")).andExpect(status().isOk()).andReturn().getRequest().getSession(false);
    }
    private ResultActions put(String url, String body) throws Exception {
        var request = org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(url).with(csrf()).session(manager);
        return mvc.perform(body == null ? request : request.contentType(MediaType.APPLICATION_JSON).content(body));
    }
}
