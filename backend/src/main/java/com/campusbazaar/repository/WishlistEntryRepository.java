package com.campusbazaar.repository;

import com.campusbazaar.entity.WishlistEntry;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishlistEntryRepository extends JpaRepository<WishlistEntry, Long> {
    List<WishlistEntry> findByUser_IdOrderByCreatedAtDesc(Long userId);
    List<WishlistEntry> findByListing_Id(Long listingId);
    Optional<WishlistEntry> findByUser_IdAndListing_Id(Long userId, Long listingId);
    boolean existsByUser_IdAndListing_Id(Long userId, Long listingId);
    void deleteByUser_IdAndListing_Id(Long userId, Long listingId);
}
