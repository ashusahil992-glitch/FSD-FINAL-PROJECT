package com.campusbazaar.service;

import com.campusbazaar.dto.NotificationDto;
import com.campusbazaar.dto.NotificationListDto;
import com.campusbazaar.entity.Conversation;
import com.campusbazaar.entity.User;
import com.campusbazaar.entity.UserNotification;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.repository.UserNotificationRepository;
import com.campusbazaar.repository.UserRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class NotificationService {

    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationStreamService streamService;

    public NotificationService(UserNotificationRepository notificationRepository,
                               UserRepository userRepository,
                               NotificationStreamService streamService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.streamService = streamService;
    }

    @Transactional(readOnly = true)
    public NotificationListDto list(String email, int page, int size) {
        if (page < 0 || size < 1 || size > 50) {
            throw new BadRequestException("Page must be non-negative and page size must be between 1 and 50.");
        }
        User user = findUser(email);
        Page<UserNotification> notifications = notificationRepository.findByRecipient_Id(
                user.getId(), PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        List<NotificationDto> items = notifications.getContent().stream()
                .map(NotificationService::toDto)
                .toList();
        return new NotificationListDto(items,
                notificationRepository.countByRecipient_IdAndReadAtIsNull(user.getId()),
                notifications.getNumber(), notifications.getSize(),
                notifications.getTotalElements(), notifications.getTotalPages());
    }

    @Transactional(readOnly = true)
    public long unreadCount(String email) {
        User user = findUser(email);
        return notificationRepository.countByRecipient_IdAndReadAtIsNull(user.getId());
    }

    @Transactional
    public NotificationListDto markRead(Long id, String email, int page, int size) {
        User user = findUser(email);
        UserNotification notification = notificationRepository.findByIdAndRecipient_Id(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found."));
        notification.markRead();
        return list(email, page, size);
    }

    @Transactional
    public NotificationListDto markAllRead(String email, int page, int size) {
        User user = findUser(email);
        notificationRepository.findByRecipient_IdAndReadAtIsNull(user.getId())
                .forEach(UserNotification::markRead);
        return list(email, page, size);
    }

    @Transactional
    public void delete(Long id, String email) {
        User user = findUser(email);
        UserNotification notification = notificationRepository.findByIdAndRecipient_Id(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found."));
        notificationRepository.delete(notification);
    }

    @Transactional
    public void create(User recipient, User actor, String title, String message, String type,
                       String targetUrl, Conversation conversation, Long relatedEntityId, String eventKey) {
        if (recipient.getId().equals(actor.getId())) return;
        if (eventKey != null && notificationRepository.existsByEventKey(eventKey)) return;
        UserNotification notification = notificationRepository.saveAndFlush(
                new UserNotification(recipient, actor, title, message, type, targetUrl,
                        conversation, relatedEntityId, eventKey));
        NotificationDto dto = toDto(notification);
        Runnable publish = () -> streamService.publish(recipient.getId(), dto);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publish.run();
                }
            });
        } else {
            publish.run();
        }
    }

    private User findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
    }

    private static NotificationDto toDto(UserNotification notification) {
        var conversation = notification.getConversation();
        return new NotificationDto(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                conversation == null ? null : conversation.getId(),
                conversation == null ? null : conversation.getListing().getId(),
                conversation == null ? null : conversation.getListing().getTitle(),
                notification.getCreatedAt(),
                notification.getReadAt(),
                notification.getType(),
                notification.getTargetUrl(),
                notification.getRelatedEntityId());
    }
}
