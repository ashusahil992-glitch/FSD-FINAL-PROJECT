package com.campusbazaar.controller;

import com.campusbazaar.dto.ApiResponse;
import com.campusbazaar.dto.WishlistCheckDto;
import com.campusbazaar.dto.WishlistEntryDto;
import com.campusbazaar.service.WishlistService;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public ApiResponse<List<WishlistEntryDto>> getWishlist(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(wishlistService.getWishlist(jwt.getSubject()));
    }

    @PostMapping("/{listingId}")
    public ResponseEntity<ApiResponse<WishlistEntryDto>> add(
            @PathVariable Long listingId, @AuthenticationPrincipal Jwt jwt) {
        WishlistEntryDto entry = wishlistService.add(jwt.getSubject(), listingId);
        return ResponseEntity.created(URI.create("/api/wishlist/" + listingId))
                .body(ApiResponse.ok("Listing added to your wishlist.", entry));
    }

    @DeleteMapping("/{listingId}")
    public ResponseEntity<Void> remove(
            @PathVariable Long listingId, @AuthenticationPrincipal Jwt jwt) {
        wishlistService.remove(jwt.getSubject(), listingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check/{listingId}")
    public ApiResponse<WishlistCheckDto> check(
            @PathVariable Long listingId, @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(wishlistService.check(jwt.getSubject(), listingId));
    }
}
