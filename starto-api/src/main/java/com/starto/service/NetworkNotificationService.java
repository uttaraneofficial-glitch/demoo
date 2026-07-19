package com.starto.service;

import com.starto.model.Signal;
import com.starto.model.User;
import com.starto.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NetworkNotificationService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Broadcasts a notification to EVERY registered user asynchronously.
     * Prevents blocking the main API thread when saving a new signal.
     */
    @Async("aiExecutor") // Using the existing executor configured in AsyncConfig
    public void broadcastNewSignalToAllUsers(Signal signal) {
        log.info("[ASYNC BROADCAST] Starting global broadcast for new signal ID: {}", signal.getId());
        
        try {
            // Fetch all users (in a production system with millions of users, this would be paginated)
            List<User> allUsers = userRepository.findAll();
            UUID creatorId = signal.getUser().getId();
            String creatorName = signal.getUser().getName();
            
            int notifiedCount = 0;
            
            for (User u : allUsers) {
                // Don't notify the person who created it
                if (u.getId().equals(creatorId)) {
                    continue;
                }
                
                try {
                    notificationService.send(
                        u.getId(), 
                        "new_network_signal", 
                        "New Signal from " + creatorName, 
                        signal.getTitle(), 
                        Map.of("signalId", signal.getId().toString(), "route", "signal_detail/" + signal.getId().toString())
                    );
                    notifiedCount++;
                } catch (Exception e) {
                    log.error("[ASYNC BROADCAST ERROR] Failed to notify user {}: {}", u.getId(), e.getMessage());
                }
            }
            
            log.info("[ASYNC BROADCAST COMPLETE] Successfully notified {} users out of {} total users.", notifiedCount, allUsers.size());
            
        } catch (Exception e) {
            log.error("[ASYNC BROADCAST FATAL ERROR] Broadcast failed completely: {}", e.getMessage(), e);
        }
    }
}
