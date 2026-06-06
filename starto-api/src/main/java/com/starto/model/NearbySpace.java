package com.starto.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "nearby_spaces")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NearbySpace implements Serializable{
        private static final long serialVersionUID = 1L;
        
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @JsonIgnore
    @ManyToOne
@JoinColumn(name = "user_id", nullable = false)
private User user;

@Column(name = "user_id", insertable = false, updatable = false)
private UUID userId;

    @org.hibernate.annotations.Formula("(SELECT u.role FROM users u WHERE u.id = user_id)")
    private String userRole;

    @org.hibernate.annotations.Formula("(SELECT u.avatar_url FROM users u WHERE u.id = user_id)")
    private String avatarUrl;

    @org.hibernate.annotations.Formula("(SELECT u.username FROM users u WHERE u.id = user_id)")
    private String username;

    @org.hibernate.annotations.Formula("(SELECT u.name FROM users u WHERE u.id = user_id)")
    private String userFullName;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String state;

    @Column(nullable = false)
    private BigDecimal lat;

    @Column(nullable = false)
    private BigDecimal lng;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String contact;
    private String website;

    @Column(name = "access_model")
    private String accessModel;

    @Column(columnDefinition = "TEXT")
    private String amenities;

    @Column(name = "is_owner")
    @Builder.Default
    private Boolean isOwner = false;

    @Builder.Default
    private Boolean verified = false;

    @Column(name = "response_count")
    @Builder.Default
    private Integer responseCount = 0;

    @Column(name = "offer_count")
    @Builder.Default
    private Integer offerCount = 0;

    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}

