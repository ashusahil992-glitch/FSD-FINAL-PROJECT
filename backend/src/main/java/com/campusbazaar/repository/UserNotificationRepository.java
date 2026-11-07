package com.campusbazaar.repository;

import com.campusbazaar.entity.UserNotification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {
    List<UserNotification> findTop50ByRecipient_IdOrderByCreatedAtDesc(Long recipientId);
    Page<UserNotification> findByRecipient_Id(Long recipientId, Pageable pageable);
    long countByRecipient_IdAndReadAtIsNull(Long recipientId);
    Optional<UserNotification> findByIdAndRecipient_Id(Long id, Long recipientId);
    List<UserNotification> findByRecipient_IdAndReadAtIsNull(Long recipientId);
    List<UserNotification> findByConversation_IdAndRecipient_IdAndReadAtIsNull(Long conversationId, Long recipientId);
    List<UserNotification> findByRecipient_IdAndReadAtIsNullAndConversation_Id(Long recipientId, Long conversationId);
    boolean existsByEventKey(String eventKey);
    int deleteByRecipient_IdAndReadAtIsNull(Long recipientId);
}
