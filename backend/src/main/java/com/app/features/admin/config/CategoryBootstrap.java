package com.app.features.admin.config;

import com.app.features.catalog.entity.Category;
import com.app.features.catalog.repository.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;

@Configuration
public class CategoryBootstrap {
    @Bean CommandLineRunner bootstrapCategories(CategoryRepository categories) {
        return args -> {
            for (String name : new String[]{"Rau lá", "Củ quả", "Trái cây", "Thực phẩm khác"}) {
                if (categories.findByNameIgnoreCase(name).isEmpty()) { Category category = new Category(); category.setName(name); categories.save(category); }
            }
        };
    }
}
