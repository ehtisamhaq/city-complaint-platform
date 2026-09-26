package com.city.complaints.domain.complaint.repository;

import com.city.complaints.domain.complaint.entity.StatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StatusHistoryRepository extends JpaRepository<StatusHistory, String> {

    List<StatusHistory> findByComplaintIdOrderByCreatedAtAsc(String complaintId);
}
