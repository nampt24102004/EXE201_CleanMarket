package com.app.features.payments.util;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public final class VnpaySignature {
    private VnpaySignature() { }
    public static SortedMap<String, String> clean(Map<String, String> values) {
        SortedMap<String, String> result = new TreeMap<>();
        values.forEach((key, value) -> { if (key.startsWith("vnp_") && !Set.of("vnp_SecureHash", "vnp_SecureHashType").contains(key) && value != null && !value.isBlank()) result.put(key, value); });
        return result;
    }
    public static String rawData(Map<String, String> values) { return clean(values).entrySet().stream().map(e -> e.getKey() + "=" + e.getValue()).collect(Collectors.joining("&")); }
    public static String query(Map<String, String> values) { return clean(values).entrySet().stream().map(e -> encode(e.getKey()) + "=" + encode(e.getValue())).collect(Collectors.joining("&")); }
    private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
    public static String sign(Map<String, String> values, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512"); mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] hash = mac.doFinal(rawData(values).getBytes(StandardCharsets.UTF_8)); return HexFormat.of().formatHex(hash);
        } catch (Exception ex) { throw new IllegalStateException("Cannot sign VNPAY request", ex); }
    }
    public static boolean valid(Map<String, String> values, String secret) {
        String supplied = values.get("vnp_SecureHash"); if (supplied == null || !supplied.matches("[0-9a-fA-F]{128}")) return false;
        return MessageDigest.isEqual(supplied.toLowerCase().getBytes(StandardCharsets.US_ASCII), sign(values, secret).getBytes(StandardCharsets.US_ASCII));
    }
}
