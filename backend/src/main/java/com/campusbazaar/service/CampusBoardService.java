package com.campusbazaar.service;

import com.campusbazaar.dto.CampusPostDto;
import com.campusbazaar.dto.CreateCampusPostRequest;
import com.campusbazaar.entity.CampusPost;
import com.campusbazaar.entity.CampusPostStatus;
import com.campusbazaar.entity.User;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.repository.CampusPostRepository;
import com.campusbazaar.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CampusBoardService {

    private final CampusPostRepository postRepository;
    private final UserRepository userRepository;
    private final StudentAccessService studentAccessService;

    public CampusBoardService(CampusPostRepository postRepository, UserRepository userRepository,
                              StudentAccessService studentAccessService) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.studentAccessService = studentAccessService;
    }

    @Transactional(readOnly = true)
    public List<CampusPostDto> list(String email) {
        User viewer = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
        if (viewer.getUniversity() == null) {
            throw new BadRequestException("A university must be selected to view the campus board.");
        }
        List<CampusPost> posts = postRepository.findByUniversityIdAndStatusNotOrderByCreatedAtDesc(
                viewer.getUniversity().getId(), CampusPostStatus.REMOVED);
        return posts.stream().map(CampusBoardService::toDto).toList();
    }

    @Transactional
    public CampusPostDto create(CreateCampusPostRequest request, String email) {
        User author = studentAccessService.requireVerified(email);
        if (author.getUniversity() == null) {
            throw new BadRequestException("A university must be selected before posting to the campus board.");
        }
        if (author.getStatus() == com.campusbazaar.entity.UserStatus.SUSPENDED) {
            throw new BadRequestException("Suspended accounts cannot create campus posts.");
        }
        CampusPost post = new CampusPost(request.title().trim(), request.description().trim(),
                request.location().trim(), request.type(), author, author.getUniversity());
        return toDto(postRepository.save(post));
    }

    @Transactional
    public CampusPostDto resolve(Long id, String email) {
        studentAccessService.requireVerified(email);
        CampusPost post = findOwned(id, email);
        if (post.getStatus() != CampusPostStatus.OPEN) {
            throw new BadRequestException("Only open posts can be marked as resolved.");
        }
        post.setStatus(CampusPostStatus.RESOLVED);
        return toDto(postRepository.save(post));
    }

    @Transactional
    public void delete(Long id, String email) {
        studentAccessService.requireVerified(email);
        CampusPost post = findOwned(id, email);
        post.setStatus(CampusPostStatus.REMOVED);
        postRepository.save(post);
    }

    private CampusPost findOwned(Long id, String email) {
        CampusPost post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campus post not found."));
        if (!post.getAuthor().getEmail().equalsIgnoreCase(email)) {
            throw new AccessDeniedException("You can only manage your own campus posts.");
        }
        if (post.getStatus() == CampusPostStatus.REMOVED) {
            throw new ResourceNotFoundException("Campus post not found.");
        }
        return post;
    }

    private static CampusPostDto toDto(CampusPost post) {
        return new CampusPostDto(post.getId(), post.getAuthor().getId(), post.getTitle(), post.getDescription(), post.getLocation(),
                post.getType().name(), post.getStatus().name(), post.getAuthor().getFullName(),
                post.getAuthor().isStudentVerified(), post.getUniversity().getName(), post.getCreatedAt());
    }
}
