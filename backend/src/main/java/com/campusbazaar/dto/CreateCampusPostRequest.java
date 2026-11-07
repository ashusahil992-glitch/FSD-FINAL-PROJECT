package com.campusbazaar.dto;

import com.campusbazaar.entity.CampusPostType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateCampusPostRequest(
        @NotBlank @Size(max = 140) String title,
        @NotBlank @Size(max = 2000) String description,
        @NotBlank @Size(max = 180) String location,
        @NotNull CampusPostType type
) {}
