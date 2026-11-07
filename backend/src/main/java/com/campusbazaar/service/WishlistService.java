package com.campusbazaar.service;

import com.campusbazaar.dto.ListingDto;
import com.campusbazaar.dto.WishlistCheckDto;
import com.campusbazaar.dto.WishlistEntryDto;
import com.campusbazaar.entity.Listing;
import com.campusbazaar.entity.ListingStatus;
import com.campusbazaar.entity.User;
import com.campusbazaar.entity.WishlistEntry;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.exception.ConflictException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.mapper.ListingMapper;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.repository.UserRepository;
import com.campusbazaar.repository.WishlistEntryRepository;
import org.springframework.dao.DataIntegrityViolationException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WishlistService {

    private final WishlistEntryRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final StudentAccessService studentAccessService;

    public WishlistService(WishlistEntryRepository wishlistRepository, UserRepository userRepository,
                           ListingRepository listingRepository, StudentAccessService studentAccessService) {
        this.wishlistRepository = wishlistRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.studentAccessService = studentAccessService;
    }

    @Transactional(readOnly = true)
    public List<WishlistEntryDto> getWishlist(String email) {
        User user = findUser(email);
        boolean discountEligible = studentAccessService.isVerifiedStudent(email);
        return wishlistRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                .map(entry -> toDto(entry, discountEligible))
                .toList();
    }

    @Transactional
    public WishlistEntryDto add(String email, Long listingId) {
        User user = findUser(email);
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found."));
        if (listing.getStatus() != ListingStatus.AVAILABLE) {
            throw new BadRequestException("Only available listings can be added to your wishlist.");
        }
        if (wishlistRepository.existsByUser_IdAndListing_Id(user.getId(), listingId)) {
            throw new ConflictException("This listing is already in your wishlist.");
        }
        WishlistEntry saved;
        try {
            saved = wishlistRepository.saveAndFlush(new WishlistEntry(user, listing));
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("This listing is already in your wishlist.");
        }
        return toDto(saved, studentAccessService.isVerifiedStudent(email));
    }

    @Transactional
    public void remove(String email, Long listingId) {
        User user = findUser(email);
        if (!listingRepository.existsById(listingId)) {
            throw new ResourceNotFoundException("Listing not found.");
        }
        wishlistRepository.deleteByUser_IdAndListing_Id(user.getId(), listingId);
    }

    @Transactional(readOnly = true)
    public WishlistCheckDto check(String email, Long listingId) {
        User user = findUser(email);
        if (!listingRepository.existsById(listingId)) {
            throw new ResourceNotFoundException("Listing not found.");
        }
        return new WishlistCheckDto(listingId,
                wishlistRepository.existsByUser_IdAndListing_Id(user.getId(), listingId));
    }

    private User findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
    }

    private static WishlistEntryDto toDto(WishlistEntry entry, boolean discountEligible) {
        Listing listing = entry.getListing();
        ListingDto listingDto = ListingMapper.toDto(listing, discountEligible);
        return new WishlistEntryDto(
                entry.getId(),
                entry.getCreatedAt(),
                listing.getStatus() == ListingStatus.AVAILABLE,
                listingDto);
    }
}
