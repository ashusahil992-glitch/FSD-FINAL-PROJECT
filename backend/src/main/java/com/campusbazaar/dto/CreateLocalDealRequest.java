package com.campusbazaar.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateLocalDealRequest(
        @NotBlank @Size(max = 140) String businessName,
        @NotBlank @Size(max = 140) String title,
        @NotBlank @Size(max = 500) String offer,
        @NotBlank @Size(max = 3000) String description,
        @Size(max = 80) String couponCode,
        @NotBlank @Size(max = 60) String category,
        @NotBlank @Size(max = 180) String location,
        @Size(max = 500) @Pattern(regexp = "^https?://.*$", message = "Must be an HTTP or HTTPS URL")
        String redemptionUrl,
        @NotNull @FutureOrPresent LocalDate validUntil
) {}
