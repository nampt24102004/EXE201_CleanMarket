package com.app.common;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

/** Paged list envelope for admin/manager listings: items of the requested page plus totals for the pager. */
public record PageResult<T>(List<T> items, long total, int page, int size, int totalPages) {
    public static final int MAX_SIZE = 100;
    public static PageRequest request(Integer page, Integer size, Sort sort) {
        int p = page == null || page < 0 ? 0 : page;
        int s = size == null || size <= 0 ? 20 : Math.min(size, MAX_SIZE);
        return PageRequest.of(p, s, sort);
    }
    public static <E, T> PageResult<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResult<>(page.getContent().stream().map(mapper).toList(), page.getTotalElements(), page.getNumber(), page.getSize(), page.getTotalPages());
    }
}
