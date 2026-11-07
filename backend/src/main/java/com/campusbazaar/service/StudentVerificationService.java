package com.campusbazaar.service;

import com.campusbazaar.dto.AdminVerificationDto;
import com.campusbazaar.dto.ReviewVerificationRequest;
import com.campusbazaar.dto.StudentVerificationHistoryDto;
import com.campusbazaar.dto.StudentVerificationProfileDto;
import com.campusbazaar.entity.Role;
import com.campusbazaar.entity.StudentVerificationRequest;
import com.campusbazaar.entity.User;
import com.campusbazaar.entity.UserStatus;
import com.campusbazaar.entity.VerificationStatus;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.exception.ConflictException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.repository.StudentVerificationRequestRepository;
import com.campusbazaar.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Locale;

@Service
public class StudentVerificationService {

    private final StudentVerificationRequestRepository verificationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final VerificationDocumentStorage documentStorage;

    public StudentVerificationService(StudentVerificationRequestRepository verificationRepository,
                                     UserRepository userRepository,
                                     NotificationService notificationService,
                                     VerificationDocumentStorage documentStorage) {
        this.verificationRepository = verificationRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.documentStorage = documentStorage;
    }

    @Transactional(readOnly = true)
    public StudentVerificationProfileDto profile(String email) {
        User student = findUser(email);
        List<StudentVerificationRequest> history = verificationRepository
                .findByStudent_IdOrderByCreatedAtDesc(student.getId());
        StudentVerificationRequest latest = history.isEmpty() ? null : history.get(0);
        return new StudentVerificationProfileDto(
                toVerificationStatus(student).name(),
                student.getMaskedStudentId(),
                student.getUniversity() == null ? null : student.getUniversity().getName(),
                latest == null ? null : latest.getRejectionReason(),
                !student.isStudentVerified() && student.getStatus() != UserStatus.SUSPENDED
                        && (latest == null || latest.getStatus() == VerificationStatus.REJECTED),
                history.stream().map(StudentVerificationService::toHistoryDto).toList());
    }

    @Transactional
    public StudentVerificationProfileDto submitDocument(String email, MultipartFile document) {
        User student = findUser(email);
        if (student.getRole() != Role.STUDENT) {
            throw new BadRequestException("Only student accounts can submit student verification documents.");
        }
        if (student.getStatus() == UserStatus.SUSPENDED) {
            throw new BadRequestException("Suspended accounts cannot submit verification documents.");
        }
        if (student.isStudentVerified()) {
            throw new ConflictException("This student account is already verified.");
        }
        if (verificationRepository.existsByStudent_IdAndStatus(student.getId(), VerificationStatus.PENDING)) {
            throw new ConflictException("A verification document is already awaiting review.");
        }

        VerificationDocumentStorage.StoredDocument stored = documentStorage.store(document);
        StudentVerificationRequest savedRequest;
        try {
            savedRequest = verificationRepository.saveAndFlush(new StudentVerificationRequest(student, stored.key()));
        } catch (RuntimeException exception) {
            documentStorage.delete(stored.key());
            throw exception;
        }
        student.setStatus(UserStatus.PENDING_STUDENT_VERIFICATION);
        for (User admin : userRepository.findAllByRole(Role.ADMIN)) {
            notificationService.create(admin, student, "Verification request submitted",
                    "A student verification request is awaiting review.", "STUDENT_VERIFICATION",
                    "/admin", null, savedRequest.getId(),
                    "verification-submitted:" + savedRequest.getId() + ":" + admin.getId());
        }
        return profile(email);
    }

    @Transactional(readOnly = true)
    public List<AdminVerificationDto> adminList(String status, String query) {
        List<StudentVerificationRequest> requests;
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            requests = verificationRepository.findAllByOrderByCreatedAtDesc();
        } else {
            VerificationStatus requestedStatus;
            try {
                requestedStatus = VerificationStatus.valueOf(status.toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException exception) {
                throw new BadRequestException("Verification status must be PENDING, VERIFIED, or REJECTED.");
            }
            requests = verificationRepository.findByStatusOrderByCreatedAtAsc(requestedStatus);
        }
        String term = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return requests.stream()
                .map(StudentVerificationService::toAdminDto)
                .filter(row -> term.isEmpty()
                        || row.studentName().toLowerCase(Locale.ROOT).contains(term)
                        || row.university().toLowerCase(Locale.ROOT).contains(term)
                        || row.maskedStudentId().toLowerCase(Locale.ROOT).contains(term))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentVerificationHistoryDto> adminHistory(Long studentId) {
        if (!userRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student account not found.");
        }
        return verificationRepository.findByStudent_IdOrderByCreatedAtDesc(studentId).stream()
                .map(StudentVerificationService::toHistoryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PrivateDocument getOwnDocument(String email) {
        User student = findUser(email);
        StudentVerificationRequest request = verificationRepository
                .findTopByStudent_IdOrderByCreatedAtDesc(student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Verification document not found."));
        return loadDocument(request);
    }

    @Transactional(readOnly = true)
    public PrivateDocument getAdminDocument(Long requestId) {
        StudentVerificationRequest request = verificationRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Verification request not found."));
        return loadDocument(request);
    }

    @Transactional
    public AdminVerificationDto review(Long requestId, ReviewVerificationRequest review, String adminEmail) {
        if (review.status() != VerificationStatus.VERIFIED && review.status() != VerificationStatus.REJECTED) {
            throw new BadRequestException("A verification request can only be approved or rejected.");
        }
        if (review.status() == VerificationStatus.REJECTED
                && (review.rejectionReason() == null || review.rejectionReason().isBlank())) {
            throw new BadRequestException("A reason is required when rejecting a verification request.");
        }
        StudentVerificationRequest request = verificationRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Verification request not found."));
        if (request.getStatus() != VerificationStatus.PENDING) {
            throw new ConflictException("This verification request has already been reviewed.");
        }

        User admin = findUser(adminEmail);
        User student = request.getStudent();
        if (student.getStatus() == UserStatus.SUSPENDED) {
            throw new BadRequestException("Suspended student accounts cannot be verified.");
        }
        if (review.status() == VerificationStatus.VERIFIED) {
            request.approve(admin);
            student.setStudentVerified(true);
            student.setStatus(UserStatus.VERIFIED);
        } else {
            request.reject(admin, review.rejectionReason().trim());
            student.setStudentVerified(false);
            student.setStatus(UserStatus.REJECTED);
        }
        boolean approved = review.status() == VerificationStatus.VERIFIED;
        String message = approved
                ? "Your student verification has been approved."
                : "Your student verification was rejected. Review the reason and resubmit your document.";
        notificationService.create(student, admin,
                approved ? "Student verification approved" : "Student verification rejected",
                message, "STUDENT_VERIFICATION", "/verification", null,
                request.getId(),
                "verification-reviewed:" + request.getId());
        return toAdminDto(request);
    }

    private PrivateDocument loadDocument(StudentVerificationRequest request) {
        return new PrivateDocument(documentStorage.load(request.getDocumentKey()),
                documentStorage.contentType(request.getDocumentKey()));
    }

    private User findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
    }

    private static VerificationStatus toVerificationStatus(User student) {
        if (student.isStudentVerified() || student.getStatus() == UserStatus.VERIFIED) {
            return VerificationStatus.VERIFIED;
        }
        if (student.getStatus() == UserStatus.REJECTED) return VerificationStatus.REJECTED;
        return VerificationStatus.PENDING;
    }

    private static StudentVerificationHistoryDto toHistoryDto(StudentVerificationRequest request) {
        return new StudentVerificationHistoryDto(
                request.getId(),
                request.getStatus().name(),
                request.getRejectionReason(),
                request.getCreatedAt(),
                request.getReviewedAt());
    }

    private static AdminVerificationDto toAdminDto(StudentVerificationRequest request) {
        User student = request.getStudent();
        return new AdminVerificationDto(
                request.getId(),
                student.getId(),
                student.getFullName(),
                student.getUniversity() == null ? "—" : student.getUniversity().getName(),
                student.getMaskedStudentId(),
                request.getStatus().name(),
                request.getRejectionReason(),
                request.getCreatedAt(),
                request.getReviewedAt());
    }

    public record PrivateDocument(byte[] content, String contentType) {}
}
