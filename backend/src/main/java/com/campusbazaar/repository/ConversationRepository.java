package com.campusbazaar.repository;

import com.campusbazaar.entity.Conversation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByBuyer_IdOrSeller_IdOrderByUpdatedAtDesc(Long buyerId, Long sellerId);
    @Query("select c from Conversation c where c.id = :id and (c.buyer.id = :userId or c.seller.id = :userId)")
    Optional<Conversation> findParticipantConversation(@Param("id") Long id, @Param("userId") Long userId);
    Optional<Conversation> findByListing_IdAndBuyer_Id(Long listingId, Long buyerId);
}
