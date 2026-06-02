package com.starto.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnifiedPostDTO {
    private UUID id;
    private String type; // "SIGNAL" or "SPACE"
    private String title;
    private String description;
    private String category;
    private String username;
    private UUID userId;
    private String userPlan;
    private String userRole;
    private String avatarUrl;
    private Boolean userIsVerified;
    private OffsetDateTime createdAt;
    
    // Stats for signals
    private Integer viewCount;
    private Integer responseCount;
    private Integer offerCount;
    private String signalStrength;
    private OffsetDateTime expiresAt;
    
    // Space specific
    private String spaceType;
    private String address;
    private String city;
    private String state;
    private String contact;
    private String website;
    private Double lat;
    private Double lng;
}
