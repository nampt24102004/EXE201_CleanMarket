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
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:demo_seed;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop"
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
    }
}
