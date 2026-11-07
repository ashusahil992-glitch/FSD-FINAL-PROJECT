package com.campusbazaar.controller;

import com.campusbazaar.dto.ApiResponse;
import com.campusbazaar.dto.CreateLocalDealRequest;
import com.campusbazaar.dto.LocalDealDto;
import com.campusbazaar.service.LocalDealService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/local-deals")
public class LocalDealController {

    private final LocalDealService dealService;

    public LocalDealController(LocalDealService dealService) {
        this.dealService = dealService;
    }

    @GetMapping
    public ApiResponse<List<LocalDealDto>> list() {
        return ApiResponse.ok(dealService.listActive());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<LocalDealDto> create(
            @Valid @RequestBody CreateLocalDealRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok("Local deal submitted successfully.",
                dealService.create(request, jwt.getSubject()));
    }
}
