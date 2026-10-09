package com.campusbazaar.controller;

import com.campusbazaar.dto.ApiResponse;
import com.campusbazaar.dto.UniversityDto;
import com.campusbazaar.service.UniversityService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/universities")
public class UniversityController {

    private final UniversityService universityService;

    public UniversityController(UniversityService universityService) {
        this.universityService = universityService;
    }

    @GetMapping
    public ApiResponse<List<UniversityDto>> list() {
        return ApiResponse.ok(universityService.listActive());
    }
}
