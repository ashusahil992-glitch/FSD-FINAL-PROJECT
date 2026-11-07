package com.campusbazaar.repository;

import com.campusbazaar.entity.ChatMessage;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByConversation_IdOrderByCreatedAtAsc(Long conversationId);
    Optional<ChatMessage> findTopByConversation_IdOrderByCreatedAtDesc(Long conversationId);
}
