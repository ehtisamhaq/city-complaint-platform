package com.city.complaints.domain.rag.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateArticleRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 300, message = "Title cannot exceed 300 characters")
        String title,

        @NotBlank(message = "Category is required")
        @Size(max = 100, message = "Category cannot exceed 100 characters")
        String category,

        @NotBlank(message = "Content is required")
        String content,

        @Size(max = 500, message = "Tags cannot exceed 500 characters")
        String tags
) {}
