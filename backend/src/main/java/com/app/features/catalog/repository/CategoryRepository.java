package com.app.features.catalog.repository;

import com.app.features.catalog.entity.Category;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> { Optional<Category> findByNameIgnoreCase(String name); List<Category> findByActiveTrueOrderByNameAsc(); }
