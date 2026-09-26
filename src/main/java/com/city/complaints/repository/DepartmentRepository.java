package com.city.complaints.repository;

import com.city.complaints.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, String> {

    Optional<Department> findByName(String name);

    boolean existsByEmail(String email);
}
