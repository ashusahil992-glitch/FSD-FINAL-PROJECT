package com.campusbazaar.repository;

import com.campusbazaar.entity.CampusPost;
import com.campusbazaar.entity.CampusPostStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampusPostRepository extends JpaRepository<CampusPost, Long> {
    List<CampusPost> findByUniversityIdAndStatusNotOrderByCreatedAtDesc(Long universityId, CampusPostStatus status);
}
