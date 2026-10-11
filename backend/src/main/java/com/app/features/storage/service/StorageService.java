package com.app.features.storage.service;

import java.time.Duration;
import java.util.Set;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    record StoredFile(String objectKey, String fileUrl, String originalFileName) {}
    StoredFile upload(MultipartFile file, String folder, Set<String> allowedExtensions);
    String readUrl(String objectKey);
}
