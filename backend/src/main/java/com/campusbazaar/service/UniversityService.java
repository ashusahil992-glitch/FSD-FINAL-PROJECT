package com.campusbazaar.service;

import com.campusbazaar.dto.UniversityDto;
import com.campusbazaar.mapper.UniversityMapper;
import com.campusbazaar.repository.UniversityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UniversityService {

    private final UniversityRepository universityRepository;

    public UniversityService(UniversityRepository universityRepository) {
        this.universityRepository = universityRepository;
    }

    @Transactional(readOnly = true)
    public List<UniversityDto> listActive() {
        return universityRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(UniversityMapper::toDto)
                .toList();
    }
}
