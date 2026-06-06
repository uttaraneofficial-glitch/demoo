package com.starto.service;

import com.starto.dto.NearbyUserDTO;
import com.starto.dto.SignalInsightsDTO;
import com.starto.dto.UnifiedPostDTO;
import com.starto.model.NearbySpace;
import com.starto.model.Signal;
import com.starto.model.SignalView;
import com.starto.model.User;
import com.starto.enums.Plan;
import com.starto.repository.ConnectionRepository;
import com.starto.repository.NearbySpaceRepository;
import com.starto.repository.SignalRepository;
import com.starto.repository.SignalViewRepository;
import com.starto.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import com.starto.service.WebSocketService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.stream.Collectors;
import com.starto.repository.CommentRepository;
import com.starto.repository.OfferRepository;

import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.starto.exception.SignalLimitExceededException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SignalService {

    private final SignalRepository signalRepository;
    private final SignalViewRepository signalViewRepository; 
    private final NearbySpaceRepository nearbySpaceRepository; 
    private final ConnectionRepository connectionRepository;
    private final WebSocketService webSocketService;
    private final PlanService planService;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;
    private final OfferRepository offerRepository;

    private static boolean syncedResponseCounts = false;


    @Caching(evict = {
    @CacheEvict(value = "signalCache", key = "'activeSignals'"),
    @CacheEvict(value = "signalCache", allEntries = true)
})
    @Transactional
    public Signal createSignal(Signal signal) {
        log.info("[DEBUG] Entering createSignal method. Type: {}, Category: {}", signal.getType(), signal.getCategory());
        if (signal.getExpiresAt() == null) {
            int days = 7;
            String strength = signal.getSignalStrength();
            if (strength != null) {
                try {
                    String numberOnly = strength.replaceAll("[^0-9]", "");
                    if (!numberOnly.isEmpty()) {
                        days = Integer.parseInt(numberOnly);
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse days from strength: {}", strength);
                }
            }
            signal.setExpiresAt(OffsetDateTime.now().plusDays(days));
        }
        Signal saved = signalRepository.save(signal);
        log.info("[DEBUG] Signal saved to DB. ID: {}", saved.getId());
        
        // Broadcast instant_help alerts to ALL users
        // Normalize strings for comparison (lowercase and remove spaces/underscores)
        String type = saved.getType() != null ? saved.getType().toLowerCase().replace(" ", "").replace("_", "") : "";
        String category = saved.getCategory() != null ? saved.getCategory().toLowerCase().replace(" ", "").replace("_", "") : "";
        
        boolean isInstantHelp = type.contains("instanthelp") || category.contains("instanthelp");
        
        log.info("[DEBUG] Checking broadcast. Type: '{}', Category: '{}', isInstantHelp: {}", type, category, isInstantHelp);
        
        if (isInstantHelp) {
            List<User> talentUsers = userRepository.findByRoleIgnoreCase("TALENT");
            UUID creatorId = saved.getUser().getId();
            log.info("[DEBUG] instant_help detected! Found {} talent users in DB. Creator: {}", talentUsers.size(), creatorId);
            
            int notified = 0;
            for (User u : talentUsers) {
                String uIdStr = u.getId().toString();
                String cIdStr = creatorId.toString();
                
                if (!uIdStr.equals(cIdStr)) {
                    try {
                        log.info("[DEBUG] Attempting to notify user: {} ({})", u.getEmail(), uIdStr);
                        notificationService.send(
                            u.getId(), 
                            "urgent_signal", 
                            "🚨 Urgent: " + saved.getTitle(), 
                            saved.getDescription(), 
                            Map.of("signalId", saved.getId().toString())
                        );
                        notified++;
                    } catch (Exception e) {
                        log.error("[ERROR] Failed to notify user {}: {}", uIdStr, e.getMessage());
                    }
                } else {
                    log.info("[DEBUG] Skipping creator: {}", cIdStr);
                }
            }
            log.info("[DEBUG] Broadcast complete. Notified {} users.", notified);
        } else {
            log.info("[DEBUG] Not an instant_help signal. Skipping broadcast. Type: {}, Category: {}", saved.getType(), saved.getCategory());
        }
        
        return saved;
    }


    public void validateSignalCreation(User user) {
        Plan plan = user.getPlan();
        
        OffsetDateTime planStart = user.getPlanPurchasedAt() != null 
            ? user.getPlanPurchasedAt() 
            : (user.getCreatedAt() != null ? user.getCreatedAt() : OffsetDateTime.now().minusDays(30));

        long count = signalRepository.countByUserIdAndCreatedAtAfter(user.getId(), planStart) +
                     nearbySpaceRepository.countByUser_IdAndCreatedAtAfter(user.getId(), planStart);

        if (!planService.canPostSignal(plan, count)) {
            throw new RuntimeException("Signal limit reached for your current plan. Upgrade for more.");
        }
    }

@Caching(evict = {
    @CacheEvict(value = "signalCache", key = "#id"),
    @CacheEvict(value = "signalCache", key = "'activeSignals'")
})
    @Transactional
    public Signal updateSignal(UUID id, Signal updatedSignal) {
        Signal existing = getSignalById(id);

        if (updatedSignal.getType() != null) existing.setType(updatedSignal.getType());
        if (updatedSignal.getSeeking() != null) existing.setSeeking(updatedSignal.getSeeking());
        if (updatedSignal.getCategory() != null) existing.setCategory(updatedSignal.getCategory());
        if (updatedSignal.getTitle() != null) existing.setTitle(updatedSignal.getTitle());
        if (updatedSignal.getDescription() != null) existing.setDescription(updatedSignal.getDescription());
        if (updatedSignal.getStage() != null) existing.setStage(updatedSignal.getStage());
        if (updatedSignal.getCity() != null) existing.setCity(updatedSignal.getCity());
        if (updatedSignal.getState() != null) existing.setState(updatedSignal.getState());
        if (updatedSignal.getLat() != null) existing.setLat(updatedSignal.getLat());
        if (updatedSignal.getLng() != null) existing.setLng(updatedSignal.getLng());
        if (updatedSignal.getTimelineDays() != null) existing.setTimelineDays(updatedSignal.getTimelineDays());
        if (updatedSignal.getSignalStrength() != null) existing.setSignalStrength(updatedSignal.getSignalStrength());
        if (updatedSignal.getExpiresAt() != null) existing.setExpiresAt(updatedSignal.getExpiresAt());

        return signalRepository.save(existing);
    }

    /**
     * Fix #7 + #8: paginated feed with JOIN FETCH — eliminates N+1 user selects.
     * Accepts ?page=0 query param; returns Page<Signal> with 20 results per page.
     */
    /**
     * Fix: Combined feed with signals and spaces.
     * Maps both entities to UnifiedPostDTO and sorts by date.
     */
    public List<UnifiedPostDTO> getSignalsFeed(int page) {
        if (!syncedResponseCounts) {
            syncResponseCounts();
            syncedResponseCounts = true;
        }

        // Fetch open signals
        List<Signal> signals = signalRepository.findAllWithUser();
        
        // Fetch all spaces (JOIN FETCHed)
        List<NearbySpace> spaces = nearbySpaceRepository.findAllWithUser();

        List<UnifiedPostDTO> unifiedList = new ArrayList<>();

        // Map Signals
        for (Signal s : signals) {
            unifiedList.add(UnifiedPostDTO.builder()
                .id(s.getId())
                .type("SIGNAL")
                .title(s.getTitle())
                .description(s.getDescription())
                .category(s.getCategory())
                .username(s.getUser().getUsername())
                .userId(s.getUser().getId())
                .userPlan(s.getUser().getPlan().name())
                .avatarUrl(s.getUser().getAvatarUrl())
                .userIsVerified(s.getUser().getIsVerified())
                .createdAt(s.getCreatedAt())
                .viewCount(s.getViewCount() != null ? s.getViewCount() : 0)
                .responseCount(s.getResponseCount() != null && s.getResponseCount() > 0 ? s.getResponseCount() : commentRepository.countBySignalId(s.getId()))
                .offerCount(s.getOfferCount() != null ? s.getOfferCount() : 0)
                .signalStrength(s.getSignalStrength())
                .expiresAt(s.getExpiresAt())
                .lat(s.getLat() != null ? s.getLat().doubleValue() : null)
                .lng(s.getLng() != null ? s.getLng().doubleValue() : null)
                .city(s.getCity())
                .state(s.getState())
                .address(s.getAddress())
                .build());
        }

        // Map Spaces
        for (NearbySpace sp : spaces) {
            unifiedList.add(UnifiedPostDTO.builder()
                .id(sp.getId())
                .type("SPACE")
                .title(sp.getName())
                .description(sp.getDescription())
                .username(sp.getUser().getUsername())
                .userId(sp.getUser().getId())
                .userPlan(sp.getUser().getPlan().name())
                .avatarUrl(sp.getUser().getAvatarUrl())
                .userIsVerified(sp.getUser().getIsVerified())
                .createdAt(sp.getCreatedAt())
                .spaceType(sp.getType())
                .address(sp.getAddress())
                .city(sp.getCity())
                .state(sp.getState())
                .contact(sp.getContact())
                .website(sp.getWebsite())
                .accessModel(sp.getAccessModel())
                .amenities(sp.getAmenities())
                .responseCount(sp.getResponseCount() != null && sp.getResponseCount() > 0 ? sp.getResponseCount() : commentRepository.countBySpaceId(sp.getId()))
                .viewCount(sp.getViewCount() != null ? sp.getViewCount() : 0)
                .offerCount(sp.getOfferCount() != null ? sp.getOfferCount() : 0)
                .lat(sp.getLat() != null ? sp.getLat().doubleValue() : null)
                .lng(sp.getLng() != null ? sp.getLng().doubleValue() : null)
                .build());
        }

        // Sort by createdAt DESC
        unifiedList.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        // Manual Pagination (20 per page)
        int start = page * 20;
        if (start >= unifiedList.size()) return new ArrayList<>();
        int end = Math.min(start + 20, unifiedList.size());
        
        return unifiedList.subList(start, end);
    }

    @Cacheable(value = "signalCache", key = "'activeSignals'")
    public List<Signal> getActiveSignals() {
        // Fix #7: JOIN FETCH loads signal + user in a single SQL query (no N+1)
        return signalRepository.findAllWithUser();
    }

    public List<Signal> getSignalsByCity(String city) {
        return signalRepository.findByCity(city);
    }

    public List<Signal> getSignalsByUser(UUID userId) {
        return signalRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<UnifiedPostDTO> getUnifiedPostsByUser(UUID userId) {
        List<UnifiedPostDTO> unifiedList = new java.util.ArrayList<>();
        List<Signal> signals = signalRepository.findByUserId(userId);
        List<NearbySpace> spaces = nearbySpaceRepository.findByUser_Id(userId);

        for (Signal s : signals) {
            unifiedList.add(UnifiedPostDTO.builder()
                    .id(s.getId())
                    .type(s.getType() != null ? s.getType() : "SIGNAL")
                    .title(s.getTitle())
                    .description(s.getDescription())
                    .category(s.getCategory())
                    .username(s.getUser().getUsername())
                    .userId(s.getUser().getId())
                    .userPlan(s.getUser().getPlan().name())
                    .userRole(s.getUser().getRole())
                    .avatarUrl(s.getUser().getAvatarUrl())
                    .userIsVerified(s.getUser().getIsVerified())
                    .createdAt(s.getCreatedAt())
                    .viewCount(s.getViewCount() != null ? s.getViewCount() : 0)
                    .responseCount(s.getResponseCount() != null && s.getResponseCount() > 0 ? s.getResponseCount() : commentRepository.countBySignalId(s.getId()))
                    .offerCount(s.getOfferCount() != null ? s.getOfferCount() : 0)
                    .signalStrength(s.getSignalStrength())
                    .expiresAt(s.getExpiresAt())
                    .city(s.getCity())
                    .state(s.getState())
                    .address(s.getAddress())
                    .lat(s.getLat() != null ? s.getLat().doubleValue() : null)
                    .lng(s.getLng() != null ? s.getLng().doubleValue() : null)
                    .build());
        }

        for (NearbySpace sp : spaces) {
            unifiedList.add(UnifiedPostDTO.builder()
                    .id(sp.getId())
                    .type("SPACE")
                    .title(sp.getName())
                    .description(sp.getDescription())
                    .category(sp.getType())
                    .username(sp.getUser().getUsername())
                    .userId(sp.getUser().getId())
                    .userPlan(sp.getUser().getPlan().name())
                    .userRole(sp.getUser().getRole())
                    .avatarUrl(sp.getUser().getAvatarUrl())
                    .userIsVerified(sp.getUser().getIsVerified())
                    .createdAt(sp.getCreatedAt())
                    .spaceType(sp.getType())
                    .address(sp.getAddress())
                    .city(sp.getCity())
                    .state(sp.getState())
                    .contact(sp.getContact())
                    .website(sp.getWebsite())
                    .accessModel(sp.getAccessModel())
                    .amenities(sp.getAmenities())
                    .viewCount(sp.getViewCount() != null ? sp.getViewCount() : 0)
                    .responseCount(sp.getResponseCount() != null && sp.getResponseCount() > 0 ? sp.getResponseCount() : commentRepository.countBySpaceId(sp.getId()))
                    .offerCount(sp.getOfferCount() != null ? sp.getOfferCount() : 0)
                    .lat(sp.getLat() != null ? sp.getLat().doubleValue() : null)
                    .lng(sp.getLng() != null ? sp.getLng().doubleValue() : null)
                    .build());
        }

        unifiedList.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return unifiedList;
    }

    @Cacheable(value = "signalCache", key = "#id")
    public Signal getSignalById(UUID id) {
        return signalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signal not found"));
    }

    @CacheEvict(value = "signalCache", key = "#signalId")
    @Transactional    public void trackView(UUID postId, UUID viewerUserId) {
        // Try Signal
        Signal signal = signalRepository.findById(postId).orElse(null);
        UUID ownerId = null;
        boolean isSpace = false;
        
        if (signal != null) {
            ownerId = signal.getUserId();
        } else {
            NearbySpace space = nearbySpaceRepository.findById(postId).orElse(null);
            if (space != null) {
                ownerId = space.getUser().getId();
                isSpace = true;
            }
        }
        
        if (ownerId == null) return; // Post not found

        Boolean isFollower = false;
        if (viewerUserId != null) {
            boolean alreadyViewed = signalViewRepository
                    .existsBySignalIdAndViewerUserId(postId, viewerUserId);

            if (alreadyViewed) return;

            isFollower =
                connectionRepository.existsByRequester_IdAndReceiver_IdAndStatus(viewerUserId, ownerId, "ACCEPTED")
                ||
                connectionRepository.existsByRequester_IdAndReceiver_IdAndStatus(ownerId, viewerUserId, "ACCEPTED");
        }

        signalViewRepository.save(
                SignalView.builder()
                        .signalId(postId)
                        .viewerUserId(viewerUserId)
                        .isFollower(isFollower)
                        .build()
        );

        if (!isSpace) {
            signalRepository.findById(postId).ifPresent(s -> {
                s.setViewCount(s.getViewCount() + 1);
                signalRepository.save(s);
                
                webSocketService.send(
                    "/topic/insights/" + postId,
                    getInsights(postId)
                );
            });
        } else {
            nearbySpaceRepository.findById(postId).ifPresent(sp -> {
                sp.setViewCount(sp.getViewCount() + 1);
                nearbySpaceRepository.save(sp);
            });
        }
    }





    //  Insights
    public SignalInsightsDTO getInsights(UUID signalId) {

    Signal signal = getSignalById(signalId);

    long followerViews = signalViewRepository
            .countBySignalIdAndIsFollower(signalId, true);

    long nonFollowerViews = signalViewRepository
            .countBySignalIdAndIsFollower(signalId, false);

    List<Object[]> raw = signalViewRepository.findViewsGroupedByDay(signalId);

    Map<String, Long> dbData = raw.stream()
        .collect(Collectors.toMap(
                row -> row[0].toString(),
                row -> ((Number) row[1]).longValue()
        ));

List<Map<String, Object>> viewsOverTime = new ArrayList<>();

for (int i = 6; i >= 0; i--) {
    String date = LocalDate.now().minusDays(i).toString();

    viewsOverTime.add(Map.of(
            "date", date,
            "count", dbData.getOrDefault(date, 0L)
    ));
}



    return SignalInsightsDTO.builder() 
            .totalViews(signal.getViewCount())
            .totalResponses(signal.getResponseCount()) 
        .totalOffers(signal.getOfferCount())  
            .followerViews(followerViews)
            .nonFollowerViews(nonFollowerViews)
            .viewsOverTime(viewsOverTime)
            .build();
        }

        @Caching(evict = {
    @CacheEvict(value = "signalCache", key = "#id"),
    @CacheEvict(value = "signalCache", key = "'activeSignals'")
})
    @Transactional
    public void deleteSignal(UUID id) {
        offerRepository.deleteBySignalId(id);
        commentRepository.deleteBySignalId(id);
        signalViewRepository.deleteBySignalId(id);
        signalRepository.deleteById(id);
    }


    public List<Signal> getSignalsByUsername(String username) {
    return signalRepository.findByUsername(username);
}

public List<Signal> getSignalsByUsernameAndSeeking(String username, String seeking) {
    return signalRepository.findByUsernameAndSeeking(username, seeking);
}

public List<Signal> getSignalsBySeekingAndCity(String seeking, String city) {
    return signalRepository.findBySeekingAndCity(seeking, city);
}

public List<Signal> getSignalsBySeeking(String seeking) {
        return signalRepository.findBySeeking(seeking);
    }

    @Cacheable(value = "signalCache", key = "#lat + '-' + #lng + '-' + #radiusKm + '-' + #role")
    public List<Signal> getNearbySignals(double lat, double lng, double radiusKm, String role) {
        if (lat == 0 && lng == 0) {
            return getActiveSignals();
        }

        double latDiff = radiusKm / 111.0;
        double lngDiff = radiusKm / (111.0 * Math.cos(Math.toRadians(lat)));

        java.math.BigDecimal latMin = java.math.BigDecimal.valueOf(lat - latDiff);
        java.math.BigDecimal latMax = java.math.BigDecimal.valueOf(lat + latDiff);
        java.math.BigDecimal lngMin = java.math.BigDecimal.valueOf(lng - lngDiff);
        java.math.BigDecimal lngMax = java.math.BigDecimal.valueOf(lng + lngDiff);

        List<Signal> candidates = signalRepository.findByStatusAndLatBetweenAndLngBetween("open", latMin, latMax, lngMin, lngMax);

        return candidates.stream()
                .filter(signal -> signal.getLat() != null && signal.getLng() != null)
                .filter(signal -> role == null || "all".equalsIgnoreCase(role) || role.equalsIgnoreCase(signal.getSeeking()))
                .filter(signal -> haversineDistanceKm(lat, lng, signal.getLat().doubleValue(), signal.getLng().doubleValue()) <= radiusKm)
                .toList();
    }

    public List<NearbySpace> getNearbySpaces(double lat, double lng, double radiusKm, String role) {
        BigDecimal latDelta = BigDecimal.valueOf(radiusKm / 111.0);
        BigDecimal lngDelta = BigDecimal.valueOf(radiusKm / (111.0 * Math.cos(Math.toRadians(lat))));

        BigDecimal latMin = BigDecimal.valueOf(lat).subtract(latDelta);
        BigDecimal latMax = BigDecimal.valueOf(lat).add(latDelta);
        BigDecimal lngMin = BigDecimal.valueOf(lng).subtract(lngDelta);
        BigDecimal lngMax = BigDecimal.valueOf(lng).add(lngDelta);

        List<NearbySpace> candidates = nearbySpaceRepository.findByLatBetweenAndLngBetween(latMin, latMax, lngMin, lngMax);

        return candidates.stream()
                .filter(space -> space.getLat() != null && space.getLng() != null)
                .filter(space -> role == null || "all".equalsIgnoreCase(role) || role.equalsIgnoreCase(space.getUser().getRole()))
                .filter(space -> haversineDistanceKm(lat, lng, space.getLat().doubleValue(), space.getLng().doubleValue()) <= radiusKm)
                .toList();
    }

    @Transactional
    public NearbySpace createNearbySpace(User user, NearbySpace nearbySpace) {
        if (nearbySpace.getLat() == null || nearbySpace.getLng() == null) {
            throw new IllegalArgumentException("lat and lng are required for nearby spaces");
        }

        return nearbySpaceRepository.save(nearbySpace);
    }

    private double haversineDistanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371 * c;
    }


    public List<NearbySpace> getSpacesByUser(UUID userId) {
    return nearbySpaceRepository.findByUser_Id(userId);
}

@Cacheable(value = "signalCache", key = "#id")
public Signal getSignalByIdSafe(UUID id) {
    return signalRepository.findById(id).orElse(null);
}

@Cacheable(value = "spaceCache", key = "#id")
public NearbySpace getNearbySpaceById(UUID id) {
    return nearbySpaceRepository.findById(id).orElse(null);
}


@Caching(evict = {
        @CacheEvict(value = "signalCache", allEntries = true),
        @CacheEvict(value = "spaceCache", allEntries = true)
})
@Transactional
public Object updatePost(UUID id, User user, Signal updatedSignal) {

    //  Try Signal
    Signal existing = signalRepository.findById(id).orElse(null);

    if (existing != null) {

        //  ownership check
        if (!existing.getUserId().equals(user.getId())) {
            throw new RuntimeException("Forbidden: You don't own this signal");
        }

        //  update fields
        existing.setType(updatedSignal.getType());
        existing.setSeeking(updatedSignal.getSeeking());
        existing.setCategory(updatedSignal.getCategory());
        existing.setTitle(updatedSignal.getTitle());
        existing.setDescription(updatedSignal.getDescription());
        existing.setStage(updatedSignal.getStage());
        existing.setCity(updatedSignal.getCity());
        existing.setState(updatedSignal.getState());
        existing.setLat(updatedSignal.getLat());
        existing.setLng(updatedSignal.getLng());
        existing.setTimelineDays(updatedSignal.getTimelineDays());
        existing.setSignalStrength(updatedSignal.getSignalStrength());

        return signalRepository.save(existing);
    }

    //  Try Space
    NearbySpace space = nearbySpaceRepository.findById(id).orElse(null);

    if (space != null) {

        //  ownership check
        if (!space.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Forbidden: You don't own this space");
        }

        //  update fields (mapped)
        space.setName(updatedSignal.getTitle());
        space.setDescription(updatedSignal.getDescription());
        space.setCity(updatedSignal.getCity());
        space.setState(updatedSignal.getState());
        space.setLat(updatedSignal.getLat());
        space.setLng(updatedSignal.getLng());

        return nearbySpaceRepository.save(space);
    }

    //  not found
    throw new RuntimeException("Post not found");
}
    
@Transactional
@Caching(evict = {
        @CacheEvict(value = "signalCache", allEntries = true),
        @CacheEvict(value = "spaceCache", allEntries = true)
})
public String deletePost(UUID id, User user) {

    //  TRY SIGNAL
    Signal signal = signalRepository.findById(id).orElse(null);

    if (signal != null) {

        //  ownership check
        if (!signal.getUserId().equals(user.getId())) {
            throw new RuntimeException("Forbidden: You don't own this signal");
        }

        offerRepository.deleteBySignalId(id);
        commentRepository.deleteBySignalId(id);
        signalViewRepository.deleteBySignalId(id);
        signalRepository.delete(signal);
        return "Signal deleted successfully";
    }

    //  TRY SPACE
    NearbySpace space = nearbySpaceRepository.findById(id).orElse(null);

    if (space != null) {

        //  ownership check 
        if (!space.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Forbidden: You don't own this space");
        }

        nearbySpaceRepository.delete(space);
        return "Space deleted successfully";
    }

    throw new RuntimeException("Post not found");
}


public List<Signal> searchSignalsByUsername(String username) {
    return signalRepository.findByUsernameLike(username)
            .stream()
            .collect(Collectors.groupingBy(
                s -> s.getUserId(),
                Collectors.collectingAndThen(
                    Collectors.toList(),
                    list -> list.stream().limit(2).collect(Collectors.toList())
                )
            ))
            .values()
            .stream()
            .flatMap(List::stream)
            .collect(Collectors.toList());
}

public List<Signal> getSignalsByUserAndCategory(UUID userId, String category) {
    return signalRepository.findByUserIdAndCategoryIgnoreCase(userId, category);
}

public List<com.starto.dto.NearbyUserDTO> getNearbyUsers(double lat, double lng, double radiusKm, String role) {

    double latDiff = radiusKm / 111.0;
    double lngDiff = radiusKm / (111.0 * Math.cos(Math.toRadians(lat)));

    BigDecimal latMin = BigDecimal.valueOf(lat - latDiff);
    BigDecimal latMax = BigDecimal.valueOf(lat + latDiff);
    BigDecimal lngMin = BigDecimal.valueOf(lng - lngDiff);
    BigDecimal lngMax = BigDecimal.valueOf(lng + lngDiff);

    List<User> candidates = userRepository
            .findByLatBetweenAndLngBetween(latMin, latMax, lngMin, lngMax);

    return candidates.stream()
    .filter((User u) -> u.getLat() != null && u.getLng() != null)
    .filter((User u) -> role == null || "all".equalsIgnoreCase(role) || role.equalsIgnoreCase(u.getRole()))
    .filter((User u) -> haversineDistanceKm(
            lat, lng,
            u.getLat().doubleValue(),
            u.getLng().doubleValue()
    ) <= radiusKm)
    .map((User u) -> {
        NearbyUserDTO dto = new NearbyUserDTO();
        dto.setId(u.getId());
        dto.setUsername(u.getUsername());
        dto.setName(u.getName());
        dto.setRole(u.getRole());
        dto.setCity(u.getCity());
        dto.setCountry(u.getCountry());
        dto.setBio(u.getBio());
        dto.setIndustry(u.getIndustry());
        dto.setSubIndustry(u.getSubIndustry());
        dto.setLat(u.getLat());
        dto.setLng(u.getLng());
        dto.setAvatarUrl(u.getAvatarUrl());
        dto.setSignalCount(u.getSignalCount() != null ? u.getSignalCount() : 0);
        dto.setNetworkSize(u.getNetworkSize() != null ? u.getNetworkSize() : 0);
        return dto;
    })
    .collect(Collectors.toList());
    }

    public List<String> getAllCities() {
        return signalRepository.findAll().stream()
                .map(Signal::getCity)
                .distinct()
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    public String calculateStrength(double viewerLat, double viewerLng, double signalLat, double signalLng) {
        double dist = haversineDistanceKm(viewerLat, viewerLng, signalLat, signalLng);
        if (dist < 10) return "high";
        if (dist < 50) return "medium";
        return "low";
    }

    @Transactional
    public void syncResponseCounts() {
        log.info("Performing bulk sync of response counts...");
        try {
            signalRepository.syncAllResponseCounts();
            nearbySpaceRepository.syncAllResponseCounts();
            log.info("Bulk sync complete.");
        } catch (Exception e) {
            log.error("Failed to perform bulk sync", e);
        }
    }
}
