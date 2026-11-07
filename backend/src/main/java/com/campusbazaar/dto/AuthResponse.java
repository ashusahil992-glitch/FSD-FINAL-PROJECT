package com.campusbazaar.dto;

public record AuthResponse(String accessToken, String tokenType, long expiresIn, AuthUserDto user) {}
