package com.campusbazaar.service;

import com.campusbazaar.dto.CreateLocalDealRequest;
import com.campusbazaar.dto.LocalDealDto;
import com.campusbazaar.entity.LocalDeal;
import com.campusbazaar.entity.User;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.repository.LocalDealRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class LocalDealService {

    private final LocalDealRepository dealRepository;
    private final StudentAccessService studentAccessService;

    public LocalDealService(LocalDealRepository dealRepository, StudentAccessService studentAccessService) {
        this.dealRepository = dealRepository;
        this.studentAccessService = studentAccessService;
    }

    @Transactional(readOnly = true)
    public List<LocalDealDto> listActive() {
        return dealRepository.findByValidUntilGreaterThanEqualOrderByValidUntilAscCreatedAtDesc(LocalDate.now())
                .stream()
                .map(LocalDealService::toDto)
                .toList();
    }

    @Transactional
    public LocalDealDto create(CreateLocalDealRequest request, String submitterEmail) {
        User submitter = studentAccessService.requireVerified(submitterEmail);
        String redemptionUrl = clean(request.redemptionUrl());
        LocalDeal deal = new LocalDeal(
                request.businessName().trim(),
                request.title().trim(),
                request.offer().trim(),
                request.description().trim(),
                clean(request.couponCode()),
                request.category().trim(),
                request.location().trim(),
                redemptionUrl,
                request.validUntil(),
                submitter);
        return toDto(dealRepository.save(deal));
    }

    private static String clean(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private static LocalDealDto toDto(LocalDeal deal) {
        return new LocalDealDto(
                deal.getId(),
                deal.getBusinessName(),
                deal.getTitle(),
                deal.getOffer(),
                deal.getDescription(),
                deal.getCouponCode(),
                deal.getCategory(),
                deal.getLocation(),
                deal.getRedemptionUrl(),
                deal.getValidUntil(),
                deal.getSubmittedBy().getFullName(),
                deal.getCreatedAt());
    }
}
