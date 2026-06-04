package com.starto.service;

import com.starto.model.Connection;
import com.starto.model.NearbySpace;
import com.starto.model.Signal;
import com.starto.model.User;
import com.starto.repository.ConnectionRepository;
import com.starto.repository.NearbySpaceRepository;
import com.starto.repository.SignalRepository;
import com.starto.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final SignalRepository signalRepository;
    private final NearbySpaceRepository nearbySpaceRepository;
    private final NotificationService notificationService;
    

    // SEND REQUEST
  @Transactional
public Connection sendRequest(User sender,
                              UUID receiverId,
                              UUID signalId,
                              UUID spaceId,
                              String message) {

    User receiver;

    // CASE 1: SIGNAL BASED REQUEST
    if (signalId != null) {

        Signal signal = signalRepository.findById(signalId)
                .orElseThrow(() -> new RuntimeException("Signal not found"));

        receiver = userRepository.findById(signal.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // CASE 2: SPACE BASED REQUEST
    else if (spaceId != null) {
        NearbySpace space = nearbySpaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found"));

        receiver = userRepository.findById(space.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // CASE 3: PROFILE BASED REQUEST
    else if (receiverId != null) {

        receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    //  invalid request
    else {
        throw new RuntimeException("receiverId, signalId, or spaceId required");
    }

    // prevent self request
    if (sender.getId().equals(receiver.getId())) {
        throw new RuntimeException("Cannot send request to yourself");
    }

    // Check if requester -> receiver already exists (PENDING or ACCEPTED)
    boolean alreadySentOrConnected = connectionRepository.existsByRequester_IdAndReceiver_IdAndStatus(sender.getId(), receiver.getId(), "PENDING")
            || connectionRepository.existsByRequester_IdAndReceiver_IdAndStatus(sender.getId(), receiver.getId(), "ACCEPTED")
            || connectionRepository.existsByRequester_IdAndReceiver_IdAndStatus(receiver.getId(), sender.getId(), "ACCEPTED");

    if (alreadySentOrConnected) {
        throw new RuntimeException("You are already connected or have a pending request with this person");
    }

    // Check if receiver -> requester already exists (PENDING)
    boolean alreadyIncoming = connectionRepository.existsByRequester_IdAndReceiver_IdAndStatus(receiver.getId(), sender.getId(), "PENDING");
    if (alreadyIncoming) {
        throw new RuntimeException("This person has already sent you a connection request. Please check your network inbox.");
    }

    Connection connection = Connection.builder()
            .requester(sender)
            .receiver(receiver)
            .signal(signalId != null
                    ? signalRepository.findById(signalId).orElse(null)
                    : null)
            .nearbySpace(spaceId != null
                    ? nearbySpaceRepository.findById(spaceId).orElse(null)
                    : null)
            .message(message)
            .status("PENDING")
            .build();

    Connection saved = connectionRepository.save(connection);

    // Refresh from DB with JOIN FETCH to ensure all formula fields and proxies are initialized
    return connectionRepository.findByIdWithUsers(saved.getId())
            .orElse(saved);
}

   
  
    // ACCEPT REQUEST

    @Transactional
    public Connection acceptRequest(User receiver, UUID connectionId) {

        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection not found"));

        // only receiver can accept
        if (!connection.getReceiver().getId().equals(receiver.getId())) {
            throw new RuntimeException("Forbidden");
        }

        if (!"PENDING".equalsIgnoreCase(connection.getStatus())) {
            throw new RuntimeException("Request not pending");
        }

        connection.setStatus("ACCEPTED");
        connection.setUpdatedAt(OffsetDateTime.now());

        // Increment networkSize for both users
        User requester = connection.getRequester();
        User rcv = connection.getReceiver();
        
        if (requester.getNetworkSize() == null) requester.setNetworkSize(0);
        if (rcv.getNetworkSize() == null) rcv.setNetworkSize(0);
        
        requester.setNetworkSize(requester.getNetworkSize() + 1);
        rcv.setNetworkSize(rcv.getNetworkSize() + 1);
        
        userRepository.save(requester);
        userRepository.save(rcv);

        notificationService.send(
            connection.getRequester().getId(),
            "CONNECTION_ACCEPTED",
            "Connection Accepted!",
            connection.getReceiver().getName() + " accepted your request",
            null
        );

        return connectionRepository.save(connection);
    }


    // REJECT REQUEST

    @Transactional
    public Connection rejectRequest(User user, UUID connectionId) {

        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection not found"));

        boolean isReceiver = connection.getReceiver().getId().equals(user.getId());
        boolean isRequester = connection.getRequester().getId().equals(user.getId());

        if (!isReceiver && !isRequester) {
            throw new RuntimeException("Forbidden");
        }

        if ("PENDING".equalsIgnoreCase(connection.getStatus())) {
            // Only receiver can reject a pending incoming request
            if (!isReceiver) {
                throw new RuntimeException("Only the receiver can reject a pending request");
            }
        } else if ("ACCEPTED".equalsIgnoreCase(connection.getStatus())) {
            // Either party can remove an active connection
            // Decrement networkSize for both users
            User requester = connection.getRequester();
            User rcv = connection.getReceiver();
            
            if (requester.getNetworkSize() != null && requester.getNetworkSize() > 0) {
                requester.setNetworkSize(requester.getNetworkSize() - 1);
            }
            if (rcv.getNetworkSize() != null && rcv.getNetworkSize() > 0) {
                rcv.setNetworkSize(rcv.getNetworkSize() - 1);
            }
            
            userRepository.save(requester);
            userRepository.save(rcv);
        } else {
            throw new RuntimeException("Connection cannot be rejected in its current state");
        }

        connection.setStatus("REJECTED");
        connection.setUpdatedAt(OffsetDateTime.now());

        return connectionRepository.save(connection);
    }

    // GET REQUESTS

    public List<Connection> getPendingRequests(UUID userId) {
        return connectionRepository.findByReceiverIdAndStatus(userId, "PENDING");
    }

    public List<Connection> getSentRequests(UUID userId) {
        return connectionRepository.findByRequesterId(userId);
    }

    public List<Connection> getAcceptedConnections(UUID userId) {
        return connectionRepository.findAcceptedByUserId(userId);
    }

    // GET BY ID
    public Connection getConnectionById(UUID connectionId) {
        return connectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection not found"));
    }

    // WHATSAPP LINK
    public String getWhatsappLink(User requester, UUID connectionId) {

        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection not found"));

        if (!connection.getRequester().getId().equals(requester.getId()) &&
            !connection.getReceiver().getId().equals(requester.getId())) {
            throw new RuntimeException("Forbidden");
        }

        User otherUser = connection.getRequester().getId().equals(requester.getId())
                ? connection.getReceiver()
                : connection.getRequester();

        if (otherUser.getPhone() == null || otherUser.getPhone().isBlank()) {
            throw new RuntimeException("Phone not found");
        }

        String phone = otherUser.getPhone().replaceAll("[^0-9]", "");
        return "https://wa.me/" + phone;
    }
}
