package com.campusbazaar.repository;

import com.campusbazaar.entity.StudentVerificationRequest;
import com.campusbazaar.entity.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentVerificationRequestRepository extends JpaRepository<StudentVerificationRequest, Long> {
    Optional<StudentVerificationRequest> findTopByStudent_IdOrderByCreatedAtDesc(Long studentId);
    List<StudentVerificationRequest> findByStudent_IdOrderByCreatedAtDesc(Long studentId);
    List<StudentVerificationRequest> findAllByOrderByCreatedAtDesc();
    List<StudentVerificationRequest> findByStatusOrderByCreatedAtAsc(VerificationStatus status);
    boolean existsByStudent_IdAndStatus(Long studentId, VerificationStatus status);
}
