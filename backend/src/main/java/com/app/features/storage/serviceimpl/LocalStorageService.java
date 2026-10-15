package com.app.features.storage.serviceimpl;

import com.app.common.BusinessException;
import com.app.features.storage.service.StorageService;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Development storage: files live on the backend's disk and are served by {@code GET /api/files/**}.
 * Enable with STORAGE_PROVIDER=local. Keys are random UUIDs, but anyone holding a URL can read the file,
 * so this is not meant for production (use r2 or gcs there).
 */
@Service
@Primary
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local")
public class LocalStorageService implements StorageService {
    public static final String URL_PREFIX = "/api/files/";
    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);
    private static final Set<String> IMAGE_MIME = Set.of("image/jpeg", "image/png");
    private static final Set<String> DOCUMENT_MIME = Set.of("image/jpeg", "image/png", "application/pdf");
    private final Path root;
    private final long maxBytes;

    public LocalStorageService(@Value("${app.storage.local-dir:uploads}") String dir, @Value("${app.upload.max-file-size-mb:10}") long maxMb) {
        this.root = Paths.get(dir).toAbsolutePath().normalize();
        this.maxBytes = maxMb * 1024L * 1024L;
    }

    @Override public StoredFile upload(MultipartFile file, String folder, Set<String> allowedExtensions) {
        String original = Objects.requireNonNullElse(file == null ? null : file.getOriginalFilename(), "file");
        String ext = extension(original);
        validate(file, ext, allowedExtensions);
        String key = folder.replaceAll("^/+|/+$", "") + "/" + UUID.randomUUID() + "." + ext;
        Path target = resolve(key);
        try (InputStream in = file.getInputStream()) {
            Files.createDirectories(target.getParent());
            Files.copy(in, target);
        } catch (IOException ex) {
            throw BusinessException.bad("UPLOAD_FAILED", "Không thể lưu file trên máy chủ");
        }
        return new StoredFile(key, readUrl(key), original);
    }

    @Override public String readUrl(String objectKey) { return URL_PREFIX + objectKey; }

    @Override public void delete(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) return;
        try { Files.deleteIfExists(resolve(objectKey)); }
        catch (IOException | RuntimeException ex) { log.warn("Could not delete local file {}: {}", objectKey, ex.getMessage()); }
    }

    /** Maps a key to a path inside the storage root; anything escaping the root (e.g. "../") is rejected. */
    public Path resolve(String objectKey) {
        Path path = root.resolve(objectKey).normalize();
        if (!path.startsWith(root)) throw BusinessException.missing("File");
        return path;
    }

    private void validate(MultipartFile file, String ext, Set<String> allowedExtensions) {
        if (file == null || file.isEmpty()) throw BusinessException.bad("INVALID_DOCUMENT", "File không được để trống");
        if (file.getSize() > maxBytes) throw BusinessException.bad("FILE_TOO_LARGE", "File vượt quá dung lượng cho phép");
        if (!allowedExtensions.contains(ext)) throw BusinessException.bad("UNSUPPORTED_FILE_TYPE", "Định dạng file không được hỗ trợ");
        String mime = Objects.requireNonNullElse(file.getContentType(), "").toLowerCase(Locale.ROOT);
        Set<String> mimeSet = allowedExtensions.equals(Set.of("jpg", "jpeg", "png")) ? IMAGE_MIME : DOCUMENT_MIME;
        if (!mimeSet.contains(mime)) throw BusinessException.bad("UNSUPPORTED_FILE_TYPE", "MIME type của file không hợp lệ");
        byte[] head;
        try (InputStream in = file.getInputStream()) { head = in.readNBytes(8); }
        catch (IOException ex) { throw BusinessException.bad("INVALID_DOCUMENT", "Không thể đọc file"); }
        boolean valid = ("pdf".equals(ext) && starts(head, new byte[]{0x25, 0x50, 0x44, 0x46}))
            || (("jpg".equals(ext) || "jpeg".equals(ext)) && starts(head, new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff}))
            || ("png".equals(ext) && starts(head, new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}));
        if (!valid) throw BusinessException.bad("INVALID_DOCUMENT", "Nội dung file không đúng định dạng");
    }
    private static boolean starts(byte[] value, byte[] prefix) {
        if (value.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) if (value[i] != prefix[i]) return false;
        return true;
    }
    private static String extension(String name) { int dot = name.lastIndexOf('.'); return dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT); }
}
