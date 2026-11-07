package com.campusbazaar.controller;

import com.campusbazaar.dto.ApiResponse;
import com.campusbazaar.dto.ChatMessageDto;
import com.campusbazaar.dto.ConversationDto;
import com.campusbazaar.dto.CreateConversationRequest;
import com.campusbazaar.dto.SendMessageRequest;
import com.campusbazaar.service.ConversationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping
    public ApiResponse<List<ConversationDto>> list(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(conversationService.list(jwt.getSubject()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConversationDto>> start(
            @Valid @RequestBody CreateConversationRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(conversationService.start(request, jwt.getSubject())));
    }

    @GetMapping("/{id}/messages")
    public ApiResponse<List<ChatMessageDto>> messages(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(conversationService.messages(id, jwt.getSubject()));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<ChatMessageDto>> send(
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(conversationService.send(id, request, jwt.getSubject())));
    }
}
