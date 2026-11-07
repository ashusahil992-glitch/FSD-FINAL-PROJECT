package com.campusbazaar.service;

import com.campusbazaar.dto.AdminDashboardDto;
import com.campusbazaar.dto.AdminListingDto;
import com.campusbazaar.dto.AdminReportDto;
import com.campusbazaar.dto.AdminUserDto;
import com.campusbazaar.dto.ListingModerationRequest;
import com.campusbazaar.dto.ReportReviewRequest;
import com.campusbazaar.entity.Listing;
import com.campusbazaar.entity.ListingReport;
import com.campusbazaar.entity.ListingReportStatus;
import com.campusbazaar.entity.ListingStatus;
import com.campusbazaar.entity.Role;
import com.campusbazaar.entity.User;
import com.campusbazaar.entity.UserStatus;
import com.campusbazaar.entity.VerificationStatus;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.repository.ListingReportRepository;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.repository.StudentVerificationRequestRepository;
import com.campusbazaar.repository.UserRepository;
import com.campusbazaar.repository.WishlistEntryRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ListingReportRepository reportRepository;
    private final StudentVerificationRequestRepository verificationRequestRepository;
    private final NotificationService notificationService;
    private final WishlistEntryRepository wishlistEntryRepository;

    public AdminService(UserRepository userRepository, ListingRepository listingRepository,
                        ListingReportRepository reportRepository,
                        StudentVerificationRequestRepository verificationRequestRepository,
                        NotificationService notificationService,
                        WishlistEntryRepository wishlistEntryRepository) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.reportRepository = reportRepository;
        this.verificationRequestRepository = verificationRequestRepository;
        this.notificationService = notificationService;
        this.wishlistEntryRepository = wishlistEntryRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardDto dashboard() {
        return new AdminDashboardDto(
                userRepository.count(),
                userRepository.countByStatus(UserStatus.PENDING_STUDENT_VERIFICATION),
                userRepository.countByStudentVerifiedTrue(),
                userRepository.countByStatus(UserStatus.SUSPENDED),
                listingRepository.count(),
                listingRepository.countByStatus(ListingStatus.AVAILABLE),
                listingRepository.countByStatus(ListingStatus.REMOVED),
                reportRepository.countByStatus(ListingReportStatus.OPEN));
    }

    @Transactional(readOnly = true)
    public List<AdminUserDto> users() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream().map(AdminService::toDto).toList();
    }

    @Transactional
    public AdminUserDto suspendUser(Long id) {
        User user = findManageableUser(id);
        user.setStatus(UserStatus.SUSPENDED);
        return toDto(user);
    }

    @Transactional
    public AdminUserDto reinstateUser(Long id) {
        User user = findManageableUser(id);
        if (user.isStudentVerified()) {
            user.setStatus(UserStatus.VERIFIED);
        } else if (user.getStatus() == UserStatus.SUSPENDED) {
            boolean previouslyRejected = verificationRequestRepository
                    .findTopByStudent_IdOrderByCreatedAtDesc(user.getId())
                    .map(request -> request.getStatus() == VerificationStatus.REJECTED)
                    .orElse(false);
            user.setStatus(previouslyRejected ? UserStatus.REJECTED : UserStatus.PENDING_STUDENT_VERIFICATION);
        }
        return toDto(user);
    }

    @Transactional(readOnly = true)
    public List<AdminListingDto> listings() {
        return listingRepository.findAllBy(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(AdminService::toDto).toList();
    }

    @Transactional
    public AdminListingDto moderateListing(Long id, ListingModerationRequest request, String adminEmail) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found."));
        if (listing.getStatus() == ListingStatus.SOLD && request.status() == ListingModerationRequest.ModerationStatus.AVAILABLE) {
            throw new BadRequestException("Sold listings cannot be restored to the marketplace.");
        }
        ListingStatus previousStatus = listing.getStatus();
        listing.setStatus(request.status() == ListingModerationRequest.ModerationStatus.REMOVED
                ? ListingStatus.REMOVED : ListingStatus.AVAILABLE);
        if (previousStatus != listing.getStatus()) {
            User admin = userRepository.findByEmailIgnoreCase(adminEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
            notificationService.create(listing.getSeller(), admin, "Listing status updated",
                    "Your listing \"" + listing.getTitle() + "\" is now " + listing.getStatus().name().toLowerCase() + ".",
                    "LISTING_STATUS", "/listings/" + listing.getId(), null, listing.getId(),
                    "listing-status:" + listing.getId() + ":" + java.util.UUID.randomUUID());
            for (var entry : wishlistEntryRepository.findByListing_Id(listing.getId())) {
                if (!entry.getUser().getId().equals(listing.getSeller().getId())) {
                    notificationService.create(entry.getUser(), admin, "Saved listing status updated",
                            "A listing you saved is now " + listing.getStatus().name().toLowerCase() + ".",
                            "LISTING_STATUS", "/listings/" + listing.getId(), null, listing.getId(),
                            "wishlist-listing-status:" + listing.getId() + ":" + entry.getUser().getId()
                                    + ":" + java.util.UUID.randomUUID());
                }
            }
        }
        return toDto(listing);
    }

    @Transactional(readOnly = true)
    public List<AdminReportDto> reports() {
        return reportRepository.findAllByOrderByCreatedAtDesc().stream().map(AdminService::toDto).toList();
    }

    @Transactional
    public AdminReportDto reviewReport(Long id, ReportReviewRequest request, String adminEmail) {
        if (request.status() == ListingReportStatus.OPEN) {
            throw new BadRequestException("A reviewed report must be marked reviewed or dismissed.");
        }
        ListingReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found."));
        ListingReportStatus previousStatus = report.getStatus();
        report.setStatus(request.status());
        if (previousStatus != request.status()) {
            User admin = userRepository.findByEmailIgnoreCase(adminEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
            notificationService.create(report.getReporter(), admin, "Report updated",
                    "An update is available for a report you submitted.", "REPORT_UPDATE",
                    "/listings/" + report.getListing().getId(), null, report.getId(),
                    "report-status:" + report.getId() + ":" + java.util.UUID.randomUUID());
        }
        return toDto(report);
    }

    private User findManageableUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admin accounts cannot be modified from this dashboard.");
        }
        return user;
    }

    private static AdminUserDto toDto(User user) {
        return new AdminUserDto(
                user.getId(), user.getFullName(), user.getEmail(), user.getMaskedStudentId(),
                user.getUniversity() == null ? null : user.getUniversity().getName(),
                user.getRole().name(), user.getStatus().name(), user.isEmailVerified(),
                user.isStudentVerified(), user.getCreatedAt());
    }

    private static AdminListingDto toDto(Listing listing) {
        return new AdminListingDto(
                listing.getId(), listing.getTitle(), listing.getPrice(), listing.getStatus().name(),
                listing.getCategory().getName(), listing.getSeller().getFullName(),
                listing.getSeller().getEmail(), listing.isDemo(), listing.getCreatedAt());
    }

    private static AdminReportDto toDto(ListingReport report) {
        return new AdminReportDto(
                report.getId(), report.getListing().getId(), report.getListing().getTitle(),
                report.getReporter().getFullName(), report.getReporter().getEmail(), report.getReason(),
                report.getStatus().name(), report.getCreatedAt());
    }
}
