package com.campusbazaar.controller;

import com.campusbazaar.dto.ApiResponse;
import com.campusbazaar.dto.NotificationListDto;
import com.campusbazaar.service.NotificationService;
import com.campusbazaar.service.NotificationStreamService;
import com.campusbazaar.dto.NotificationUnreadCountDto;
import com.campusbazaar.entity.User;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.repository.UserRepository;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationStreamService streamService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService,
                                   NotificationStreamService streamService,
                                   UserRepository userRepository) {
        this.notificationService = notificationService;
        this.streamService = streamService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ApiResponse<NotificationListDto> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(notificationService.list(jwt.getSubject(), page, size));
    }

    @GetMapping("/unread-count")
    public ApiResponse<NotificationUnreadCountDto> unreadCount(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(new NotificationUnreadCountDto(notificationService.unreadCount(jwt.getSubject())));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationListDto> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(notificationService.markRead(id, jwt.getSubject(), page, size));
    }

    @PatchMapping("/read-all")
    public ApiResponse<NotificationListDto> markAllRead(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(notificationService.markAllRead(jwt.getSubject(), page, size));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        notificationService.delete(id, jwt.getSubject());
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal Jwt jwt) {
        User user = userRepository.findByEmailIgnoreCase(jwt.getSubject())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
        return streamService.subscribe(user.getId());
    }
}
