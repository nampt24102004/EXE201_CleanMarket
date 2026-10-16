package com.app.features.storage.serviceimpl;

import com.app.common.BusinessException;
import com.app.features.storage.service.StorageService;
import com.google.auth.ServiceAccountSigner;
import com.google.cloud.iam.credentials.v1.IamCredentialsClient;
import com.google.cloud.iam.credentials.v1.SignBlobRequest;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.google.protobuf.ByteString;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "gcs")
public class GoogleCloudStorageService implements StorageService {
    private static final Set<String> IMAGE_MIME = Set.of("image/jpeg", "image/png");
    private static final Set<String> DOCUMENT_MIME = Set.of("image/jpeg", "image/png", "application/pdf");
    private final Storage storage = StorageOptions.getDefaultInstance().getService();
    private final String bucket;
    private final ServiceAccountSigner signer;
    private final long maxBytes;
    private final Duration readTtl;

    public GoogleCloudStorageService(
            @Value("${app.storage.bucket:}") String bucket,
            @Value("${app.storage.signer-service-account:}") String signerServiceAccount,
            @Value("${app.upload.max-file-size-mb:10}") long maxMb,
            @Value("${app.r2.read-url-ttl-seconds:900}") long ttlSeconds) {
        this.bucket = bucket;
        this.signer = new IamSigner(signerServiceAccount);
        this.maxBytes = maxMb * 1024L * 1024L;
        this.readTtl = Duration.ofSeconds(ttlSeconds);
    }

    @Override public StoredFile upload(MultipartFile file, String folder, Set<String> allowedExtensions) {
        validate(file, allowedExtensions);
        ensureConfigured();
        String original = Objects.requireNonNullElse(file.getOriginalFilename(), "file");
        String key = folder.replaceAll("^/+|/+$", "") + "/" + UUID.randomUUID() + "." + extension(original);
        try {
            BlobInfo blob = BlobInfo.newBuilder(bucket, key).setContentType(file.getContentType()).build();
            storage.create(blob, file.getBytes(), Storage.BlobTargetOption.doesNotExist());
            return new StoredFile(key, readUrl(key), original);
        } catch (BusinessException ex) { throw ex; }
        catch (Exception ex) { throw BusinessException.bad("UPLOAD_FAILED", "Không thể tải file lên kho lưu trữ"); }
    }

    @Override public void delete(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) return;
        try { storage.delete(bucket, objectKey); }
        catch (RuntimeException ex) { org.slf4j.LoggerFactory.getLogger(GoogleCloudStorageService.class).warn("Could not delete object {}: {}", objectKey, ex.getMessage()); }
    }

    @Override public String readUrl(String objectKey) {
        ensureConfigured();
        try {
            return storage.signUrl(BlobInfo.newBuilder(bucket, objectKey).build(), readTtl.toSeconds(), TimeUnit.SECONDS,
                Storage.SignUrlOption.withV4Signature(), Storage.SignUrlOption.signWith(signer)).toString();
        } catch (Exception ex) {
            throw BusinessException.bad("SIGNED_URL_FAILED", "Không thể tạo liên kết đọc file");
        }
    }

    private void validate(MultipartFile file, Set<String> allowedExtensions) {
        if (file == null || file.isEmpty()) throw BusinessException.bad("INVALID_DOCUMENT", "File không được để trống");
        if (file.getSize() > maxBytes) throw BusinessException.bad("FILE_TOO_LARGE", "File vượt quá dung lượng cho phép");
        String ext = extension(Objects.requireNonNullElse(file.getOriginalFilename(), ""));
        if (!allowedExtensions.contains(ext)) throw BusinessException.bad("UNSUPPORTED_FILE_TYPE", "Định dạng file không được hỗ trợ");
        String mime = Objects.requireNonNullElse(file.getContentType(), "").toLowerCase(Locale.ROOT);
        Set<String> mimeSet = allowedExtensions.equals(Set.of("jpg", "jpeg", "png")) ? IMAGE_MIME : DOCUMENT_MIME;
        if (!mimeSet.contains(mime)) throw BusinessException.bad("UNSUPPORTED_FILE_TYPE", "MIME type của file không hợp lệ");
        try {
            byte[] head = Arrays.copyOf(file.getBytes(), Math.min(8, (int) file.getSize()));
            boolean valid = ("pdf".equals(ext) && starts(head, new byte[]{0x25,0x50,0x44,0x46}))
                || (("jpg".equals(ext) || "jpeg".equals(ext)) && starts(head, new byte[]{(byte)0xff,(byte)0xd8,(byte)0xff}))
                || ("png".equals(ext) && starts(head, new byte[]{(byte)0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a}));
            if (!valid) throw BusinessException.bad("INVALID_DOCUMENT", "Nội dung file không đúng định dạng");
        } catch (BusinessException ex) { throw ex; }
        catch (Exception ex) { throw BusinessException.bad("INVALID_DOCUMENT", "Không thể đọc file"); }
    }

    private void ensureConfigured() {
        if (bucket.isBlank() || signer.getAccount().isBlank())
            throw BusinessException.bad("STORAGE_NOT_CONFIGURED", "Google Cloud Storage chưa được cấu hình trên backend");
    }
    private boolean starts(byte[] value, byte[] prefix) {
        if (value.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) if (value[i] != prefix[i]) return false;
        return true;
    }
    private String extension(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static final class IamSigner implements ServiceAccountSigner {
        private final String account;
        private IamSigner(String account) { this.account = Objects.requireNonNullElse(account, ""); }
        @Override public String getAccount() { return account; }
        @Override public byte[] sign(byte[] bytes) {
            try (IamCredentialsClient client = IamCredentialsClient.create()) {
                SignBlobRequest request = SignBlobRequest.newBuilder()
                    .setName("projects/-/serviceAccounts/" + account)
                    .setPayload(ByteString.copyFrom(bytes)).build();
                return client.signBlob(request).getSignedBlob().toByteArray();
            } catch (Exception ex) {
                throw new IllegalStateException("Could not sign Cloud Storage URL", ex);
            }
        }
    }
}
