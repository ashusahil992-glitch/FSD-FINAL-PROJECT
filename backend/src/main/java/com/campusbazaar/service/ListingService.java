package com.campusbazaar.service;

import com.campusbazaar.dto.ListingDto;
import com.campusbazaar.dto.CreateListingRequest;
import com.campusbazaar.dto.ListingSearchPageDto;
import com.campusbazaar.entity.Category;
import com.campusbazaar.entity.Listing;
import com.campusbazaar.entity.ListingCondition;
import com.campusbazaar.entity.ListingStatus;
import com.campusbazaar.entity.ListingType;
import com.campusbazaar.entity.User;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.mapper.ListingMapper;
import com.campusbazaar.repository.CategoryRepository;
import com.campusbazaar.repository.ListingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.ArrayList;
import jakarta.persistence.criteria.JoinType;

@Service
public class ListingService {

    private final ListingRepository listingRepository;
    private final CategoryRepository categoryRepository;
    private final StudentAccessService studentAccessService;

    public ListingService(ListingRepository listingRepository, CategoryRepository categoryRepository,
                          StudentAccessService studentAccessService) {
        this.listingRepository = listingRepository;
        this.categoryRepository = categoryRepository;
        this.studentAccessService = studentAccessService;
    }

    @Transactional(readOnly = true)
    public List<ListingDto> listAvailable(String viewerEmail) {
        boolean discountEligible = studentAccessService.isVerifiedStudent(viewerEmail);
        return listingRepository.findByStatusOrderByCreatedAtDesc(ListingStatus.AVAILABLE)
                .stream()
                .map(listing -> ListingMapper.toDto(listing, discountEligible))
                .toList();
    }

    @Transactional(readOnly = true)
    public ListingDto getAvailable(Long id, String viewerEmail) {
        boolean discountEligible = studentAccessService.isVerifiedStudent(viewerEmail);
        return listingRepository.findByIdAndStatus(id, ListingStatus.AVAILABLE)
                .map(listing -> ListingMapper.toDto(listing, discountEligible))
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found."));
    }

    @Transactional(readOnly = true)
    public ListingSearchPageDto search(String query, String categorySlug, BigDecimal minPrice, BigDecimal maxPrice,
                                       ListingType listingType, boolean studentDiscountsOnly,
                                       boolean hostelClearanceOnly, String sortBy, int page, int size, String viewerEmail) {
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new BadRequestException("Minimum price cannot be greater than maximum price.");
        }
        String normalizedSort = sortBy.toLowerCase(Locale.ROOT);
        Sort sort = switch (sortBy.toLowerCase(Locale.ROOT)) {
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "price").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "student_price_asc" -> Sort.by(Sort.Direction.ASC, "studentDiscountedPrice")
                    .and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "discount_desc" -> Sort.by(Sort.Direction.DESC, "studentDiscountPercentage")
                    .and(Sort.by(Sort.Direction.DESC, "createdAt"));
            default -> throw new BadRequestException(
                    "Sort must be newest, price_asc, price_desc, student_price_asc, or discount_desc.");
        };

        Specification<Listing> specification = (root, criteriaQuery, builder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("status"), ListingStatus.AVAILABLE));
            if (hostelClearanceOnly) predicates.add(builder.isTrue(root.get("hostelClearance")));
            if (studentDiscountsOnly || normalizedSort.equals("student_price_asc")
                    || normalizedSort.equals("discount_desc")) {
                predicates.add(builder.isTrue(root.get("studentDiscountEnabled")));
            }
            if (query != null && !query.isBlank()) {
                String term = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                var category = root.join("category", JoinType.LEFT);
                var seller = root.join("seller", JoinType.LEFT);
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("title")), term),
                        builder.like(builder.lower(root.get("description")), term),
                        builder.like(builder.lower(category.get("name")), term),
                        builder.like(builder.lower(seller.get("fullName")), term)));
            }
            if (categorySlug != null && !categorySlug.isBlank()) {
                var category = root.join("category", JoinType.LEFT);
                var parent = category.join("parent", JoinType.LEFT);
                predicates.add(builder.or(
                        builder.equal(category.get("slug"), categorySlug),
                        builder.equal(parent.get("slug"), categorySlug)));
            }
            if (minPrice != null) predicates.add(builder.greaterThanOrEqualTo(root.get("price"), minPrice));
            if (maxPrice != null) predicates.add(builder.lessThanOrEqualTo(root.get("price"), maxPrice));
            if (listingType != null) predicates.add(builder.equal(root.get("listingType"), listingType));
            criteriaQuery.distinct(true);
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };

        Page<Listing> results = listingRepository.findAll(specification, PageRequest.of(page, size, sort));
        boolean discountEligible = studentAccessService.isVerifiedStudent(viewerEmail);
        return new ListingSearchPageDto(
                results.getContent().stream().map(listing -> ListingMapper.toDto(listing, discountEligible)).toList(),
                results.getNumber(),
                results.getSize(),
                results.getTotalElements(),
                results.getTotalPages(),
                results.isFirst(),
                results.isLast());
    }

    @Transactional
    public ListingDto create(CreateListingRequest request, String sellerEmail) {
        User seller = studentAccessService.requireVerified(sellerEmail);
        Category category = categoryRepository.findBySlugAndActiveTrue(request.categorySlug().trim())
                .orElseThrow(() -> new ResourceNotFoundException("The selected category is not available."));

        Listing listing = new Listing(request.title().trim(), request.description().trim(),
                normalizedPrice(request), request.condition(), request.listingType(), null, category, seller);
        applyStudentDiscount(listing, request, false);
        listing.setHostelClearance(Boolean.TRUE.equals(request.hostelClearance()));
        return ListingMapper.toDto(listingRepository.save(listing),
                studentAccessService.isVerifiedStudent(sellerEmail));
    }

    @Transactional
    public ListingDto update(Long id, CreateListingRequest request, String sellerEmail) {
        Listing listing = findOwnedAvailable(id, sellerEmail);
        Category category = categoryRepository.findBySlugAndActiveTrue(request.categorySlug().trim())
                .orElseThrow(() -> new ResourceNotFoundException("The selected category is not available."));
        listing.setTitle(request.title().trim());
        listing.setDescription(request.description().trim());
        listing.setPrice(normalizedPrice(request));
        listing.setCondition(request.condition());
        listing.setListingType(request.listingType());
        listing.setCategory(category);
        applyStudentDiscount(listing, request, true);
        listing.setHostelClearance(Boolean.TRUE.equals(request.hostelClearance()));
        return ListingMapper.toDto(listingRepository.save(listing),
                studentAccessService.isVerifiedStudent(sellerEmail));
    }

    @Transactional
    public void delete(Long id, String sellerEmail) {
        Listing listing = findOwnedAvailable(id, sellerEmail);
        listing.setStatus(ListingStatus.REMOVED);
        listingRepository.save(listing);
    }

    private Listing findOwnedAvailable(Long id, String sellerEmail) {
        studentAccessService.requireVerified(sellerEmail);
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found."));
        if (!listing.getSeller().getEmail().equalsIgnoreCase(sellerEmail)) {
            throw new AccessDeniedException("You can only manage your own listings.");
        }
        if (listing.isDemo()) {
            throw new AccessDeniedException("Demo listings cannot be changed.");
        }
        if (listing.getStatus() != ListingStatus.AVAILABLE) {
            throw new BadRequestException("Only available listings can be changed.");
        }
        return listing;
    }

    private BigDecimal normalizedPrice(CreateListingRequest request) {
        BigDecimal price = request.price();
        if (request.listingType() == ListingType.GIVEAWAY || request.listingType() == ListingType.EXCHANGE
                || request.listingType() == ListingType.SERVICE && price == null) {
            return BigDecimal.ZERO;
        }
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("A price greater than zero is required for sale and rental listings.");
        }
        return price;
    }

    private void applyStudentDiscount(Listing listing, CreateListingRequest request, boolean preserveWhenUnspecified) {
        if (request.studentDiscountEnabled() == null && preserveWhenUnspecified) {
            if (listing.isStudentDiscountEnabled()) {
                BigDecimal percentage = StudentDiscountPricing.discountPercentage(
                        listing.getPrice(), listing.getStudentDiscountedPrice());
                listing.setStudentDiscount(true, listing.getStudentDiscountedPrice(), percentage);
            }
            return;
        }
        if (!Boolean.TRUE.equals(request.studentDiscountEnabled())) {
            listing.setStudentDiscount(false, null, null);
            return;
        }
        BigDecimal discountedPrice = request.studentDiscountedPrice();
        BigDecimal discountPercentage = StudentDiscountPricing.discountPercentage(listing.getPrice(), discountedPrice);
        listing.setStudentDiscount(true, discountedPrice.setScale(2), discountPercentage);
    }
}
