package com.campusbazaar.service;

import com.campusbazaar.dto.ChatMessageDto;
import com.campusbazaar.dto.ConversationDto;
import com.campusbazaar.dto.CreateConversationRequest;
import com.campusbazaar.dto.SendMessageRequest;
import com.campusbazaar.entity.ChatMessage;
import com.campusbazaar.entity.Conversation;
import com.campusbazaar.entity.Listing;
import com.campusbazaar.entity.ListingStatus;
import com.campusbazaar.entity.User;
import com.campusbazaar.entity.UserNotification;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.repository.ChatMessageRepository;
import com.campusbazaar.repository.ConversationRepository;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.repository.UserNotificationRepository;
import com.campusbazaar.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final UserNotificationRepository notificationRepository;
    private final StudentAccessService studentAccessService;
    private final NotificationService notificationService;

    public ConversationService(ConversationRepository conversationRepository,
                               ChatMessageRepository messageRepository,
                               ListingRepository listingRepository,
                               UserRepository userRepository,
                               UserNotificationRepository notificationRepository,
                               StudentAccessService studentAccessService,
                               NotificationService notificationService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.studentAccessService = studentAccessService;
        this.notificationService = notificationService;
    }

    @Transactional
    public ConversationDto start(CreateConversationRequest request, String email) {
        User buyer = studentAccessService.requireVerified(email);
        Listing listing = listingRepository.findByIdAndStatus(request.listingId(), ListingStatus.AVAILABLE)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found."));
        User seller = listing.getSeller();
        if (seller.getId().equals(buyer.getId())) {
            throw new BadRequestException("You cannot start a conversation about your own listing.");
        }
        Conversation conversation = conversationRepository.findByListing_IdAndBuyer_Id(listing.getId(), buyer.getId())
                .orElseGet(() -> conversationRepository.save(new Conversation(listing, buyer, seller)));
        return toDto(conversation, buyer.getId());
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> list(String email) {
        User user = findUser(email);
        return conversationRepository.findByBuyer_IdOrSeller_IdOrderByUpdatedAtDesc(user.getId(), user.getId())
                .stream()
                .map(conversation -> toDto(conversation, user.getId()))
                .toList();
    }

    @Transactional
    public List<ChatMessageDto> messages(Long conversationId, String email) {
        User user = findUser(email);
        Conversation conversation = findParticipantConversation(conversationId, user.getId());
        notificationRepository.findByRecipient_IdAndReadAtIsNullAndConversation_Id(user.getId(), conversationId)
                .forEach(UserNotification::markRead);
        return messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversation.getId())
                .stream()
                .map(ConversationService::toMessageDto)
                .toList();
    }

    @Transactional
    public ChatMessageDto send(Long conversationId, SendMessageRequest request, String email) {
        User sender = studentAccessService.requireVerified(email);
        Conversation conversation = findParticipantConversation(conversationId, sender.getId());
        User recipient = conversation.otherParticipant(sender.getId());
        String content = request.content().trim();
        if (content.isEmpty()) throw new BadRequestException("Message cannot be empty.");

        ChatMessage message = messageRepository.save(new ChatMessage(conversation, sender, content));
        conversation.touch();
        notificationService.create(
                recipient,
                sender,
                "New message",
                "New message from " + sender.getFullName(),
                "MESSAGE",
                "/messages/" + conversation.getId(),
                conversation,
                message.getId(),
                "message:" + message.getId());
        return toMessageDto(message);
    }

    private User findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
    }

    private Conversation findParticipantConversation(Long id, Long userId) {
        return conversationRepository.findParticipantConversation(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found."));
    }

    private ConversationDto toDto(Conversation conversation, Long userId) {
        String lastMessage = messageRepository.findTopByConversation_IdOrderByCreatedAtDesc(conversation.getId())
                .map(ChatMessage::getContent)
                .orElse("");
        User otherParticipant = conversation.otherParticipant(userId);
        return new ConversationDto(
                conversation.getId(),
                conversation.getListing().getId(),
                conversation.getListing().getTitle(),
                otherParticipant.getId(),
                otherParticipant.getFullName(),
                lastMessage,
                conversation.getLastMessageAt());
    }

    private static ChatMessageDto toMessageDto(ChatMessage message) {
        return new ChatMessageDto(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getFullName(),
                message.getContent(),
                message.getCreatedAt());
    }
}
