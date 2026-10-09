package com.campusbazaar.mapper;

import com.campusbazaar.dto.UniversityDto;
import com.campusbazaar.entity.University;

public final class UniversityMapper {
    private UniversityMapper() {}

    public static UniversityDto toDto(University u) {
        return new UniversityDto(u.getId(), u.getName(), u.getDomain(), u.getCity(), u.getState(), u.getCountry());
    }
}
