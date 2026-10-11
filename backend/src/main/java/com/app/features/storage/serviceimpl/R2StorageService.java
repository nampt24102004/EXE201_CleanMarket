package com.app.features.storage.serviceimpl;

import com.app.common.BusinessException;
import com.app.features.storage.service.StorageService;
import java.net.URI;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "r2", matchIfMissing = true)
public class R2StorageService implements StorageService {
    private static final Set<String> IMAGE_MIME = Set.of("image/jpeg", "image/png");
    private static final Set<String> DOCUMENT_MIME = Set.of("image/jpeg", "image/png", "application/pdf");
    private final String accountId, endpointOverride, region, accessKey, secretKey, bucket, publicBaseUrl;
    private final long maxBytes;
    private final Duration readTtl;

    public R2StorageService(
            @Value("${app.r2.account-id:}") String accountId,
            @Value("${app.storage.endpoint:}") String endpointOverride,
            @Value("${app.storage.region:auto}") String region,
            @Value("${app.storage.access-key-id:}") String accessKey,
            @Value("${app.storage.secret-access-key:}") String secretKey,
            @Value("${app.storage.bucket:}") String bucket,
            @Value("${app.storage.public-base-url:}") String publicBaseUrl,
            @Value("${app.upload.max-file-size-mb:10}") long maxMb,
            @Value("${app.r2.read-url-ttl-seconds:900}") long ttlSeconds) {
        this.accountId = accountId; this.endpointOverride = endpointOverride; this.region = region;
        this.accessKey = accessKey; this.secretKey = secretKey;
        this.bucket = bucket; this.publicBaseUrl = publicBaseUrl == null ? "" : publicBaseUrl.replaceAll("/+$", "");
        this.maxBytes = maxMb * 1024L * 1024L; this.readTtl = Duration.ofSeconds(ttlSeconds);
    }

    @Override public StoredFile upload(MultipartFile file, String folder, Set<String> allowedExtensions) {
        validate(file, allowedExtensions);
        ensureConfigured();
        String original = Objects.requireNonNullElse(file.getOriginalFilename(), "file");
        String extension = extension(original);
        String key = folder.replaceAll("^/+|/+$", "") + "/" + UUID.randomUUID() + "." + extension;
        try (S3Client client = s3()) {
            client.putObject(PutObjectRequest.builder().bucket(bucket).key(key).contentType(file.getContentType()).build(),
                RequestBody.fromBytes(file.getBytes()));
        } catch (Exception ex) {
            throw BusinessException.bad("UPLOAD_FAILED", "Không thể tải file lên kho lưu trữ");
        }
        String url = publicBaseUrl.isBlank() ? readUrl(key) : publicBaseUrl + "/" + key;
        return new StoredFile(key, url, original);
    }

    @Override public String readUrl(String objectKey) {
        ensureConfigured();
        try (S3Presigner presigner = presigner()) {
            GetObjectRequest get = GetObjectRequest.builder().bucket(bucket).key(objectKey).build();
            return presigner.presignGetObject(GetObjectPresignRequest.builder().signatureDuration(readTtl).getObjectRequest(get).build()).url().toString();
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

    private boolean starts(byte[] value, byte[] prefix) {
        if (value.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) if (value[i] != prefix[i]) return false;
        return true;
    }
    private String extension(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
    private void ensureConfigured() {
        if (((endpointOverride == null || endpointOverride.isBlank()) && accountId.isBlank())
                || accessKey.isBlank() || secretKey.isBlank() || bucket.isBlank())
            throw BusinessException.bad("STORAGE_NOT_CONFIGURED", "Kho lưu trữ chưa được cấu hình trên backend");
    }
    private StaticCredentialsProvider credentials() { return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)); }
    private URI endpoint() {
        if (endpointOverride != null && !endpointOverride.isBlank()) return URI.create(endpointOverride);
        return URI.create("https://" + accountId + ".r2.cloudflarestorage.com");
    }
    private S3Client s3() {
        return S3Client.builder().endpointOverride(endpoint()).region(Region.of(region)).credentialsProvider(credentials())
            .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).chunkedEncodingEnabled(false).build()).build();
    }
    private S3Presigner presigner() {
        return S3Presigner.builder().endpointOverride(endpoint()).region(Region.of(region)).credentialsProvider(credentials())
            .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build()).build();
    }
}
