package com.app.common;

import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    public record ErrorBody(boolean success, String code, String message, List<String> errors) { }
    @ExceptionHandler(BusinessException.class)
    ResponseEntity<ErrorBody> business(BusinessException ex) { return ResponseEntity.status(ex.status()).body(new ErrorBody(false, ex.code(), ex.getMessage(), List.of())); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorBody> validation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream().map(e -> e.getField() + ": " + e.getDefaultMessage()).toList();
        return ResponseEntity.badRequest().body(new ErrorBody(false, "VALIDATION_ERROR", "Dữ liệu không hợp lệ", errors));
    }
    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ErrorBody> denied() { return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorBody(false, "FORBIDDEN", "Bạn không có quyền truy cập", List.of())); }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ErrorBody> conflict() { return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorBody(false, "DATA_CONFLICT", "Dữ liệu đã tồn tại hoặc đang được sử dụng", List.of())); }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorBody> unexpected(Exception ex) { return ResponseEntity.internalServerError().body(new ErrorBody(false, "INTERNAL_ERROR", "Đã xảy ra lỗi hệ thống", List.of())); }
}
