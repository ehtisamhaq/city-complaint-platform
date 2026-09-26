package com.city.complaints.domain.staff.repository;

import com.city.complaints.domain.staff.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, String> {

    Optional<Staff> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Staff> findByDepartmentId(String departmentId);
}
