package com.starto.service;

import com.starto.dto.OfferRequestDTO;
import com.starto.model.Offer;
import com.starto.model.Signal;
import com.starto.model.User;
import com.starto.repository.ConnectionRepository;
import com.starto.repository.OfferRepository;
import com.starto.repository.SignalRepository;
import com.starto.repository.UserRepository;
import com.starto.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OfferService {

    private final OfferRepository offerRepository;
    private final SignalRepository signalRepository;
    private final UserRepository userRepository;
    private final ConnectionRepository connectionRepository;
    private final WebSocketService webSocketService;
    private final NotificationService notificationService;

    // talent sends offer
  @Transactional
public Offer sendOffer(User talent, OfferRequestDTO dto) {


    Signal signal = signalRepository.findById(dto.getSignalId())
            .orElseThrow(() -> new RuntimeException("Signal not found"));

    // block self-offer
    if (signal.getUserId().equals(talent.getId())) {
        throw new RuntimeException("You cannot send an offer to your own signal");
    }

    //  one offer per signal
    offerRepository.findByRequesterIdAndSignalId(talent.getId(), signal.getId())
            .ifPresent(o -> {
                throw new RuntimeException("You already sent an offer for this signal");
            });

    Offer offer = Offer.builder()
            .requester(talent)
            .receiver(signal.getUser())
            .signal(signal)
            .organizationName(dto.getOrganizationName())
            .portfolioLink(dto.getPortfolioLink())
            .message(dto.getMessage())
            .status("PENDING")
            .build();

    // increment safely
    Integer count = signal.getOfferCount();
    signal.setOfferCount((count == null ? 0 : count) + 1);
    signalRepository.save(signal);

    Offer savedOffer = offerRepository.save(offer);

    //  WEBSOCKET (ADD HERE)
    webSocketService.send(
            "/topic/offers/" + savedOffer.getReceiver().getId(),
            Map.of(
                    "type", "NEW_OFFER",
                    "data", savedOffer
            )
    );

    Map<String, Object> data = Map.of(
    "offerId", savedOffer.getId(),
    "signalId", signal.getId(),
    "organizationName", savedOffer.getOrganizationName(),
    "action", "NEW_OFFER"
);

   notificationService.send(
    savedOffer.getReceiver().getId(),
    "NEW_OFFER",
    "New Offer Received!",
    talent.getName() + " sent you an offer",
    data   
);

    return savedOffer;
}

    // founder accepts offer
    @Transactional
    public Offer acceptOffer(User founder, UUID offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));

        if (!offer.getReceiver().getId().equals(founder.getId())) {
            throw new RuntimeException("Not authorized to accept this offer");
        }

        if (!"PENDING".equalsIgnoreCase(offer.getStatus())) {
            throw new RuntimeException("Offer is not in pending state");
        }

        offer.setStatus("ACCEPTED");
        offer.setUpdatedAt(OffsetDateTime.now());
        Offer updated = offerRepository.save(offer);

        // CREATE CONNECTION
        com.starto.model.Connection connection = com.starto.model.Connection.builder()
                .requester(offer.getRequester())
                .receiver(offer.getReceiver())
                .signal(offer.getSignal())
                .message("Connected via help offer: " + offer.getMessage())
                .status("ACCEPTED")
                .build();
        connectionRepository.save(connection);

        // INCREMENT NETWORK SIZE
        User requester = offer.getRequester();
        User rcv = offer.getReceiver();
        if (requester.getNetworkSize() == null) requester.setNetworkSize(0);
        if (rcv.getNetworkSize() == null) rcv.setNetworkSize(0);
        requester.setNetworkSize(requester.getNetworkSize() + 1);
        rcv.setNetworkSize(rcv.getNetworkSize() + 1);
        userRepository.save(requester);
        userRepository.save(rcv);

        // Notify
        webSocketService.send("/topic/offers/" + updated.getRequester().getId(), Map.of("type", "OFFER_ACCEPTED", "data", updated));
        notificationService.send(updated.getRequester().getId(), "OFFER_ACCEPTED", "Offer Accepted!", "Your offer was accepted and a connection was created", Map.of("signalId", offer.getSignal().getId().toString()));

        return updated;
    }

    // founder rejects offer
    @Transactional
    public Offer rejectOffer(User founder, UUID offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));
        if (!offer.getReceiver().getId().equals(founder.getId())) {
            throw new RuntimeException("Not authorized to reject this offer");
        }
        offer.setStatus("REJECTED");
        offer.setUpdatedAt(OffsetDateTime.now());
        return offerRepository.save(offer);
    }

    @Transactional
    public void deleteOffer(User user, UUID offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));
        
        // Either requester can delete their sent offer, or receiver can delete received one
        if (!offer.getRequester().getId().equals(user.getId()) && 
            !offer.getReceiver().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to delete this offer");
        }
        
        offerRepository.delete(offer);
    }

    

    // founder sees pending offers
    public List<Offer> getAllOffers(UUID founderId) {
    return offerRepository.findAllByReceiverId(founderId);
}

    // talent sees sent offers
    public List<Offer> getSentOffers(UUID talentId) {
        return offerRepository.findByRequesterId(talentId);
    }

    // get whatsapp link after acceptance
    public String getWhatsappLink(User user, UUID offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));

        // verify user is part of this offer
        if (!offer.getRequesterId().equals(user.getId()) &&
            !offer.getReceiverId().equals(user.getId())) {
            throw new RuntimeException("Forbidden");
        }

        // get other person's phone
        UUID otherUserId = offer.getRequesterId().equals(user.getId())
                ? offer.getReceiverId()
                : offer.getRequesterId();

        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (otherUser.getPhone() == null || otherUser.getPhone().isBlank()) {
            throw new RuntimeException("User has no phone number registered");
        }

        String phone = otherUser.getPhone().replaceAll("[^0-9]", "");
        return "https://wa.me/" + phone;
    }

    public Offer getOfferById(UUID offerId) {
        return offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));
    }

    public long countUserOffers(UUID userId, OffsetDateTime startDate) {
    return offerRepository.countByRequesterIdAndCreatedAtAfter(userId, startDate);
}
}