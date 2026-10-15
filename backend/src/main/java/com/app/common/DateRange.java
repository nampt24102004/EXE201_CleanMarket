package com.app.common;

import java.time.*;

/** Converts inclusive calendar dates from query params into [from, to) instants in Vietnam time. */
public record DateRange(Instant from, Instant to) {
    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    public static DateRange of(LocalDate from, LocalDate to) {
        if (from != null && to != null && to.isBefore(from)) throw BusinessException.bad("INVALID_DATE_RANGE", "Ngày kết thúc phải sau ngày bắt đầu");
        return new DateRange(from == null ? null : from.atStartOfDay(ZONE).toInstant(), to == null ? null : to.plusDays(1).atStartOfDay(ZONE).toInstant());
    }
}
