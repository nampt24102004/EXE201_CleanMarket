package com.app;

import com.app.features.auth.entity.UserAccount;
import com.app.features.auth.repository.UserRepository;
import com.app.features.auth.repository.UserRoleAssignmentRepository;
import com.app.features.catalog.entity.Category;
import com.app.features.catalog.repository.CategoryRepository;
import com.app.features.products.repository.ProductRepository;
import com.app.features.suppliers.repository.SupplierRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={
    "spring.datasource.url=jdbc:h2:mem:supplier_workflow;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.auth.email-verification-required=false",
    "app.mail.delivery-enabled=false"
})
@AutoConfigureMockMvc
class SupplierProductApprovalFlowTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired SupplierRepository suppliers;
    @Autowired UserRoleAssignmentRepository assignments;
    @Autowired CategoryRepository categories;
    @Autowired ProductRepository products;
    @Autowired PasswordEncoder encoder;

    @Test void supplierApprovalGrantsPartnerWithoutRemovingUserAndProductNeedsApproval() throws Exception {
        MockHttpSession applicant=register("flow@app.test");
        mvc.perform(post("/api/supplier-applications").with(csrf()).session(applicant).contentType(MediaType.APPLICATION_JSON)
            .content(application("Flow Farm","flow@app.test","PENDING")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("PENDING"));
        mvc.perform(get("/api/partner/products").session(applicant)).andExpect(status().isForbidden());

        MockHttpSession manager=login(manager("flow-manager@app.test","MANAGER"));
        long supplierId=suppliers.findByOwnerId(users.findByEmailIgnoreCase("flow@app.test").orElseThrow().getId()).orElseThrow().getId();
        mvc.perform(put("/api/manager/suppliers/"+supplierId+"/approve").with(csrf()).session(manager))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("APPROVED"));

        UserAccount approved=users.findByEmailIgnoreCase("flow@app.test").orElseThrow();
        assertEquals("PARTNER",approved.getRole());
        assertTrue(assignments.findByUserId(approved.getId()).stream().anyMatch(a->"USER".equals(a.getRole().getName())));
        assertTrue(assignments.findByUserId(approved.getId()).stream().anyMatch(a->"PARTNER".equals(a.getRole().getName())));

        MockHttpSession partner=login("flow@app.test");
        mvc.perform(get("/api/partner/products").session(partner)).andExpect(status().isOk());
        mvc.perform(get("/api/cart").session(partner)).andExpect(status().isOk());
        Category category=new Category();category.setName("Flow category");categories.save(category);
        String product="{\"name\":\"Flow vegetable\",\"description\":\"Demo\",\"price\":1000,\"unit\":\"kg\",\"categoryId\":"+category.getId()+",\"imageUrl\":\"https://example.test/product.jpg\",\"stock\":10,\"origin\":\"Hà Nội\"}";
        String body=mvc.perform(post("/api/partner/products").with(csrf()).session(partner).contentType(MediaType.APPLICATION_JSON).content(product))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.approvalStatus").value("DRAFT")).andReturn().getResponse().getContentAsString();
        long productId=new com.fasterxml.jackson.databind.ObjectMapper().readTree(body).path("data").path("id").asLong();
        MockMultipartFile fakePdf=new MockMultipartFile("file","fake.pdf","application/pdf","not-a-pdf".getBytes());
        mvc.perform(multipart("/api/partner/products/"+productId+"/certificates").file(fakePdf).with(csrf()).session(partner)
            .param("certificateType","VIETGAP").param("certificateNumber","VG-INVALID").param("issuer","Tester"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_DOCUMENT"));
        mvc.perform(get("/api/products/"+productId)).andExpect(status().isNotFound());
        mvc.perform(post("/api/partner/products/"+productId+"/submit").with(csrf()).session(partner))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.approvalStatus").value("PENDING"));
        mvc.perform(get("/api/products/"+productId)).andExpect(status().isNotFound());
        mvc.perform(put("/api/manager/products/"+productId+"/approve").with(csrf()).session(manager))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("ACTIVE"));
        mvc.perform(get("/api/products/"+productId)).andExpect(status().isOk());

        MockHttpSession other=register("other@app.test");
        mvc.perform(put("/api/partner/products/"+productId).with(csrf()).session(other).contentType(MediaType.APPLICATION_JSON).content(product))
            .andExpect(status().isForbidden());
    }

    @Test void rejectedSupplierCanEditAndResubmitAndInvalidUploadIsRejected() throws Exception {
        MockHttpSession applicant=register("resubmit@app.test");
        mvc.perform(post("/api/supplier-applications").with(csrf()).session(applicant).contentType(MediaType.APPLICATION_JSON)
            .content(application("Old name","resubmit@app.test","PENDING"))).andExpect(status().isOk());
        long id=suppliers.findByOwnerId(users.findByEmailIgnoreCase("resubmit@app.test").orElseThrow().getId()).orElseThrow().getId();
        MockHttpSession admin=login(manager("flow-admin@app.test","ADMIN"));
        mvc.perform(put("/api/manager/suppliers/"+id+"/reject").with(csrf()).session(admin).contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Thiếu thông tin vùng trồng\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.rejectionReason").value("Thiếu thông tin vùng trồng"));
        mvc.perform(put("/api/supplier-applications/me").with(csrf()).session(applicant).contentType(MediaType.APPLICATION_JSON)
            .content("{\"supplierName\":\"New name\",\"email\":\"resubmit@app.test\",\"phone\":\"0912345678\",\"address\":\"Hà Nội\",\"supplierType\":\"FARM\"}"))
            .andExpect(status().isOk());
        mvc.perform(post("/api/supplier-applications/me/resubmit").with(csrf()).session(applicant))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("PENDING")).andExpect(jsonPath("$.data.rejectionReason").doesNotExist());
    }

    private MockHttpSession register(String email)throws Exception{
        var result=mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"fullName\":\"Applicant\",\"email\":\""+email+"\",\"password\":\"secure-pass-123\"}")).andExpect(status().isOk()).andReturn();
        return (MockHttpSession)result.getRequest().getSession(false);
    }
    private UserAccount manager(String email,String role){return users.findByEmailIgnoreCase(email).orElseGet(()->{UserAccount u=new UserAccount();u.setEmail(email);u.setFullName(role);u.setPasswordHash(encoder.encode("secure-pass-123"));u.setRole(role);return users.save(u);});}
    private MockHttpSession login(UserAccount user)throws Exception{return login(user.getEmail());}
    private MockHttpSession login(String email)throws Exception{var result=mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"email\":\""+email+"\",\"password\":\"secure-pass-123\"}")).andExpect(status().isOk()).andReturn();return (MockHttpSession)result.getRequest().getSession(false);}
    private String application(String name,String email,String status){return "{\"supplierName\":\""+name+"\",\"email\":\""+email+"\",\"phone\":\"0912345678\",\"address\":\"Hà Nội\",\"supplierType\":\"FARM\",\"description\":\"Demo\",\"documentUrl\":\"https://example.test/document.pdf\",\"confirmed\":true}";}
}
