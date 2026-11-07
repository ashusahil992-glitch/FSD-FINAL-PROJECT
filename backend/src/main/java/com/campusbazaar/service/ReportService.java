package com.campusbazaar.service;

import com.campusbazaar.dto.CreateReportRequest;
import com.campusbazaar.entity.Listing;
import com.campusbazaar.entity.ListingReport;
import com.campusbazaar.entity.User;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.repository.ListingReportRepository;
import com.campusbazaar.repository.ListingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private final ListingReportRepository reportRepository;
    private final ListingRepository listingRepository;
    private final StudentAccessService studentAccessService;

    public ReportService(ListingReportRepository reportRepository, ListingRepository listingRepository,
                        StudentAccessService studentAccessService) {
        this.reportRepository = reportRepository;
        this.listingRepository = listingRepository;
        this.studentAccessService = studentAccessService;
    }

    @Transactional
    public void report(CreateReportRequest request, String email) {
        User reporter = studentAccessService.requireVerified(email);
        Listing listing = listingRepository.findById(request.listingId())
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found."));
        if (listing.getSeller().getId().equals(reporter.getId())) {
            throw new BadRequestException("You cannot report your own listing.");
        }
        reportRepository.save(new ListingReport(listing, reporter, request.reason().trim()));
    }
}
