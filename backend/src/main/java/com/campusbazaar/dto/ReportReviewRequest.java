package com.campusbazaar.dto;

import com.campusbazaar.entity.ListingReportStatus;
import jakarta.validation.constraints.NotNull;

public record ReportReviewRequest(@NotNull ListingReportStatus status) {}
