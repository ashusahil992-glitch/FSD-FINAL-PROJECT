package com.campusbazaar.service;

import com.campusbazaar.dto.AuthResponse;
import com.campusbazaar.dto.AuthUserDto;
import com.campusbazaar.dto.LoginRequest;
import com.campusbazaar.dto.RegisterRequest;
import com.campusbazaar.entity.Role;
import com.campusbazaar.entity.University;
import com.campusbazaar.entity.User;
import com.campusbazaar.entity.UserStatus;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.exception.ConflictException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.exception.UnauthorizedException;
import com.campusbazaar.mapper.AuthUserMapper;
import com.campusbazaar.repository.UniversityRepository;
import com.campusbazaar.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final UniversityRepository universityRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final long tokenLifetimeSeconds;

    public AuthService(UserRepository userRepository,
                       UniversityRepository universityRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtEncoder jwtEncoder,
                       @Value("${app.jwt.expiration-seconds:7200}") long tokenLifetimeSeconds) {
        this.userRepository = userRepository;
        this.universityRepository = universityRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtEncoder = jwtEncoder;
        this.tokenLifetimeSeconds = tokenLifetimeSeconds;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String studentId = request.studentId().trim();

        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BadRequestException("Password must be no more than 72 UTF-8 bytes.");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with this email already exists.");
        }
        University university = universityRepository.findByIdAndActiveTrue(request.universityId())
                .orElseThrow(() -> new ResourceNotFoundException("The selected university is not available."));
        if (userRepository.existsByUniversity_IdAndStudentId(university.getId(), studentId)) {
            throw new ConflictException("This student ID is already registered at the selected university.");
        }

        User user = new User(request.fullName().trim(), email, passwordEncoder.encode(request.password()), Role.STUDENT);
        user.setStudentId(studentId);
        user.setUniversity(university);
        user.setStatus(UserStatus.PENDING_STUDENT_VERIFICATION);
        user.setEmailVerified(false);
        user.setStudentVerified(false);
        User savedUser = userRepository.save(user);

        return issueToken(savedUser);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        final Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (AuthenticationException ex) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        String authenticatedEmail = authentication.getName();
        User user = userRepository.findByEmailIgnoreCase(authenticatedEmail)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));
        return issueToken(user);
    }

    @Transactional(readOnly = true)
    public AuthUserDto getCurrentUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
        return AuthUserMapper.toDto(user);
    }

    private AuthResponse issueToken(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("campusbazaar")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(tokenLifetimeSeconds))
                .subject(user.getEmail())
                .id(UUID.randomUUID().toString())
                .claim("authorities", java.util.List.of("ROLE_" + user.getRole().name()))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AuthResponse(token, "Bearer", tokenLifetimeSeconds, AuthUserMapper.toDto(user));
    }
}
