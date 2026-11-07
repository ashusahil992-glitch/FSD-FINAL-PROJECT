package com.campusbazaar.repository;

import com.campusbazaar.entity.LocalDeal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface LocalDealRepository extends JpaRepository<LocalDeal, Long> {
    List<LocalDeal> findByValidUntilGreaterThanEqualOrderByValidUntilAscCreatedAtDesc(LocalDate today);
}
