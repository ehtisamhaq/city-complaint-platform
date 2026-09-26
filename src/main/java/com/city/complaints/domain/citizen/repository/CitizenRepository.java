package com.city.complaints.domain.citizen.repository;

import com.city.complaints.domain.citizen.entity.Citizen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CitizenRepository extends JpaRepository<Citizen, String> {

    Optional<Citizen> findByEmail(String email);

    boolean existsByEmail(String email);
}
