package com.campusbazaar.repository;

import com.campusbazaar.entity.University;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UniversityRepository extends JpaRepository<University, Long> {
    List<University> findByActiveTrueOrderByNameAsc();
    Optional<University> findByIdAndActiveTrue(Long id);
}
