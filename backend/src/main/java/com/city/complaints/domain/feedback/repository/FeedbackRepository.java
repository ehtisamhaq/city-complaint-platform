package com.city.complaints.domain.feedback.repository;

import com.city.complaints.domain.feedback.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, String> {

    Optional<Feedback> findByComplaintId(String complaintId);

    boolean existsByComplaintId(String complaintId);
}
