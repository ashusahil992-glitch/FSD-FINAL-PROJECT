package com.campusbazaar.repository;

import com.campusbazaar.entity.User;
import com.campusbazaar.entity.Role;
import com.campusbazaar.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUniversity_IdAndStudentId(Long universityId, String studentId);
    List<User> findAllByOrderByCreatedAtDesc();
    List<User> findAllByRole(Role role);
    long countByStatus(UserStatus status);
    long countByStudentVerifiedTrue();
}
