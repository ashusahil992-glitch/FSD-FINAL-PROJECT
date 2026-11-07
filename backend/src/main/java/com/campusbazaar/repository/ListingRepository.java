package com.campusbazaar.repository;

import com.campusbazaar.entity.Listing;
import com.campusbazaar.entity.ListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Sort;

public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {
    List<Listing> findByStatusOrderByCreatedAtDesc(ListingStatus status);
    Optional<Listing> findByIdAndStatus(Long id, ListingStatus status);
    long countByStatus(ListingStatus status);
    List<Listing> findAllBy(Sort sort);
}
