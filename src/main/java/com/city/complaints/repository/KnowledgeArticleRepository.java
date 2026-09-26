package com.city.complaints.repository;

import com.city.complaints.entity.KnowledgeArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeArticleRepository extends JpaRepository<KnowledgeArticle, String> {

    List<KnowledgeArticle> findByCategoryIgnoreCase(String category);

    @Query("""
            SELECT a FROM KnowledgeArticle a
            WHERE LOWER(a.title) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(a.content) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(a.tags) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(a.category) LIKE LOWER(CONCAT('%', :query, '%'))
            """)
    List<KnowledgeArticle> searchArticles(@Param("query") String query);
}
