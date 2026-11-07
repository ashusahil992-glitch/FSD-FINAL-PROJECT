package com.campusbazaar.service;

import com.campusbazaar.entity.User;
import com.campusbazaar.entity.UserStatus;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.repository.UserRepository;
import com.campusbazaar.entity.Role;
import org.springframework.stereotype.Service;

@Service
public class StudentAccessService {

    private final UserRepository userRepository;

    public StudentAccessService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User requireVerified(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new BadRequestException("Suspended accounts cannot perform this action.");
        }
        if (user.getRole() != com.campusbazaar.entity.Role.ADMIN && !user.isStudentVerified()) {
            String message = user.getStatus() == UserStatus.REJECTED
                    ? "Your student verification was rejected. Resubmit your documents before performing this action."
                    : "Student verification is required before performing this action.";
            throw new BadRequestException(message);
        }
        return user;
    }

    public boolean isVerifiedStudent(String email) {
        if (email == null || email.isBlank()) return false;
        return userRepository.findByEmailIgnoreCase(email)
                .map(user -> user.getRole() == Role.STUDENT
                        && user.getStatus() == UserStatus.VERIFIED
                        && user.isStudentVerified())
                .orElse(false);
    }
}
