package com.app.common;

public record ApiResponse<T>(boolean success, T data, String message) {
    public static <T> ApiResponse<T> ok(T data) { return new ApiResponse<>(true, data, "Success"); }
    public static <T> ApiResponse<T> ok(T data, String message) { return new ApiResponse<>(true, data, message); }
}
