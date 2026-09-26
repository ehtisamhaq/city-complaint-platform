package com.city.complaints.domain.rag.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

/**
 * Represents a municipal knowledge base article (FAQs, department directories,
 * resolution SLAs, emergency protocols, and municipal guidelines) used for RAG.
 */
@Entity
@Table(name = "knowledge_articles", indexes = {
        @Index(name = "idx_knowledge_category", columnList = "category"),
        @Index(name = "idx_knowledge_tags", columnList = "tags")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeArticle {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private String id;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 500)
    private String tags; // Comma-separated keywords for hybrid search

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
