package com.campusbazaar.repository;

import com.campusbazaar.entity.ListingReport;
import com.campusbazaar.entity.ListingReportStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ListingReportRepository extends JpaRepository<ListingReport, Long> {
    List<ListingReport> findAllByOrderByCreatedAtDesc();
    long countByStatus(ListingReportStatus status);
}
