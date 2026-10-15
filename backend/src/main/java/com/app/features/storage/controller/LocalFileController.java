package com.app.features.storage.controller;

import com.app.features.storage.serviceimpl.LocalStorageService;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Serves files saved by {@link LocalStorageService}; only exists when STORAGE_PROVIDER=local. */
@RestController
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local")
public class LocalFileController {
    private final LocalStorageService storage;
    public LocalFileController(LocalStorageService storage) { this.storage = storage; }

    @GetMapping(LocalStorageService.URL_PREFIX + "**")
    public ResponseEntity<Resource> file(HttpServletRequest request) throws java.io.IOException {
        String key = request.getRequestURI().substring(request.getContextPath().length() + LocalStorageService.URL_PREFIX.length());
        Path path = storage.resolve(java.net.URLDecoder.decode(key, java.nio.charset.StandardCharsets.UTF_8));
        if (!Files.isRegularFile(path)) return ResponseEntity.notFound().build();
        String type = Files.probeContentType(path);
        return ResponseEntity.ok().contentType(type == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(type))
            .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600").body(new FileSystemResource(path));
    }
}
