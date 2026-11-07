package com.campusbazaar.service;

import com.campusbazaar.dto.CategoryDto;
import com.campusbazaar.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> listActive() {
        return categoryRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(category -> new CategoryDto(
                        category.getId(),
                        category.getName(),
                        category.getSlug(),
                        category.getIcon(),
                        category.getParent() == null ? null : category.getParent().getName()))
                .toList();
    }
}
