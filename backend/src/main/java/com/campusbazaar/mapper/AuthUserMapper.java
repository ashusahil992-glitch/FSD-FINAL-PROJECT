package com.campusbazaar.mapper;

import com.campusbazaar.dto.AuthUserDto;
import com.campusbazaar.entity.User;

public final class AuthUserMapper {
    private AuthUserMapper() {}

    public static AuthUserDto toDto(User user) {
        return new AuthUserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getMaskedStudentId(),
                user.getUniversity() == null ? null : user.getUniversity().getName(),
                user.getUniversity() == null ? null : user.getUniversity().getId(),
                user.getRole().name(),
                user.getStatus().name(),
                user.isEmailVerified(),
                user.isStudentVerified());
    }
}
