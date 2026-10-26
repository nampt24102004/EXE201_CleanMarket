package com.app;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:demo_seed;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.demo.seed=false"
})
class DemoDataSqlTest {
    @Autowired DataSource dataSource;
    @Autowired JdbcTemplate jdbc;
    @Autowired PasswordEncoder passwords;

    @Test void demoSqlMatchesCurrentEntitySchema() throws Exception {
        String sql = Files.readString(Path.of("..", "database", "demo_data.sql"), StandardCharsets.UTF_8)
            .replace("CREATE DATABASE IF NOT EXISTS cleanmarket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;", "")
            .replace("USE cleanmarket_db;", "")
            .replace("SET NAMES utf8mb4;", "")
            .replace("START TRANSACTION;", "")
            .replace("COMMIT;", "")
            // H2 has DATEADD rather than MySQL DATE_ADD/DATE_SUB.
            .replace("DATE_ADD(CURRENT_DATE, INTERVAL 1 YEAR)", "DATEADD('YEAR', 1, CURRENT_DATE)")
            .replace("DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)", "DATEADD('DAY', 30, CURRENT_DATE)")
            .replace("DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY)", "DATEADD('DAY', -2, CURRENT_DATE)")
            .replace("DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY)", "DATEADD('DAY', -1, CURRENT_DATE)")
            .replace("DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR)", "DATEADD('YEAR', 1, CURRENT_TIMESTAMP)");
        try (var connection = dataSource.getConnection()) {
            ScriptUtils.executeSqlScript(connection, new EncodedResource(
                new ByteArrayResource(sql.getBytes(StandardCharsets.UTF_8)), StandardCharsets.UTF_8));
            // The demo script must remain idempotent when imported more than once.
            ScriptUtils.executeSqlScript(connection, new EncodedResource(
                new ByteArrayResource(sql.getBytes(StandardCharsets.UTF_8)), StandardCharsets.UTF_8));
        }
        assertEquals(6, jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id BETWEEN 101 AND 106", Integer.class));
        assertEquals(4, jdbc.queryForObject("SELECT COUNT(*) FROM orders WHERE id BETWEEN 1401 AND 1404", Integer.class));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM refunds WHERE id = 2301", Integer.class));
        String hash = jdbc.queryForObject("SELECT password_hash FROM users WHERE id = 101", String.class);
        assertTrue(passwords.matches("Demo@123456", hash));

        // Existing databases may still have the pomelo placeholder. Only that
        // placeholder should be replaced; partner-supplied photos must survive.
        String placeholder = "https://placehold.co/900x700?text=Buoi+Ba+Vi";
        jdbc.update("UPDATE products SET image_url = ? WHERE id = 704", placeholder);
        jdbc.update("UPDATE product_images SET image_url = ? WHERE product_id = 704", placeholder);
        jdbc.update("UPDATE products SET image_url = 'https://example.com/custom.jpg' WHERE id = 703");
        try (var connection = dataSource.getConnection()) {
            var migration = new EncodedResource(new ClassPathResource("db/migration/V20261026__pomelo_product_image.sql"), StandardCharsets.UTF_8);
            ScriptUtils.executeSqlScript(connection, migration);
            ScriptUtils.executeSqlScript(connection, migration);
        }
        assertEquals("/images/products/buoi.webp", jdbc.queryForObject("SELECT image_url FROM products WHERE id = 704", String.class));
        assertEquals("/images/products/buoi.webp", jdbc.queryForObject("SELECT image_url FROM product_images WHERE id = 804", String.class));
        assertEquals("https://example.com/custom.jpg", jdbc.queryForObject("SELECT image_url FROM products WHERE id = 703", String.class));
    }
}
