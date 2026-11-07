package com.campusbazaar.dto;

public record AdminDashboardDto(
        long totalUsers,
        long pendingStudentVerification,
        long verifiedStudents,
        long suspendedUsers,
        long totalListings,
        long availableListings,
        long removedListings,
        long openReports
) {}
