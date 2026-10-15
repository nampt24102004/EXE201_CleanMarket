package com.app.common;

import org.springframework.http.HttpStatus;

public class BusinessException extends RuntimeException {
    private final String code;
    private final HttpStatus status;
    public BusinessException(String code, String message, HttpStatus status) { super(message); this.code = code; this.status = status; }
    public String code() { return code; }
    public HttpStatus status() { return status; }
    public static BusinessException bad(String code, String message) { return new BusinessException(code, message, HttpStatus.BAD_REQUEST); }
    public static BusinessException forbidden() { return new BusinessException("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN); }
    public static BusinessException forbidden(String code, String message) { return new BusinessException(code, message, HttpStatus.FORBIDDEN); }
    public static BusinessException missing(String resource) { return new BusinessException("NOT_FOUND", resource + " không tồn tại", HttpStatus.NOT_FOUND); }
    public static BusinessException conflict(String code, String message) { return new BusinessException(code, message, HttpStatus.CONFLICT); }
}
