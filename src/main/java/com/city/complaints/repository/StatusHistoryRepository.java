package com.city.complaints.repository;

import com.city.complaints.entity.StatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StatusHistoryRepository extends JpaRepository<StatusHistory, String> {

    List<StatusHistory> findByComplaintIdOrderByCreatedAtAsc(String complaintId);
}
