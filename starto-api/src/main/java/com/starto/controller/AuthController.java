package com.starto.controller;

import com.starto.dto.RegisterRequestDTO;
import com.starto.model.User;
import com.starto.service.UserService;
import com.starto.service.EmailService;
import com.starto.service.PasswordResetService;
import com.starto.repository.UserRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final UserService userService;
    private final PasswordResetService passwordResetService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    /**
     * Fix #3: accept RegisterRequestDTO (validated) instead of raw User entity.
     * @Valid activates bean validation — returns 400 + field errors on constraint violation.
     *
     * Fix #4: passwords are managed entirely by Firebase — no local BCrypt needed.
     * Firebase Admin SDK handles all authentication; we store firebase_uid only, never passwords.
     * BCryptPasswordEncoder is NOT wired because there are no locally stored passwords.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(
            Authentication authentication,
            @Valid @RequestBody RegisterRequestDTO dto) {

        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String firebaseUid = authentication.getPrincipal().toString();

        User user = userService.createOrUpdateUser(
                firebaseUid,
                dto.getEmail(),
                dto.getName(),
                dto.getPhone(),
                dto.getRole(),
                dto.getCity(),
                dto.getState(),
                dto.getCountry(),
                dto.getGender(),
                dto.getBio(),
                dto.getAvatarUrl(),
                dto.getLat(),
                dto.getLng(),
                dto.getAddress()
        );

        // Sync verification and send welcome email immediately if already verified (e.g. Social Auth)
        userService.syncVerificationAndSendWelcome(user);

        return ResponseEntity.ok(user);
    }

    @GetMapping("/me")
public ResponseEntity<?> getCurrentUser(Authentication authentication) {

    if (authentication == null || authentication.getPrincipal() == null) {
        return ResponseEntity.status(401)
                .body(Map.of("error", "Unauthorized"));
    }

    String firebaseUid = authentication.getPrincipal().toString();

    java.util.Optional<User> userOpt = userService.getUserByFirebaseUid(firebaseUid);
    if (userOpt.isPresent()) {
        User user = userOpt.get();
        userService.syncVerificationAndSendWelcome(user);
        return ResponseEntity.ok(user);
    } else {
        // IMPORTANT FIX
        return ResponseEntity.ok(Map.of(
                "pending", true,
                "message", "Profile still syncing"
        ));
    }
}
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest body) {
        passwordResetService.sendPasswordResetEmail(body.getEmail());
        // Always return 200 — don't leak whether the email exists
        return ResponseEntity.ok(Map.of("message", "If this email is registered, a reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            Authentication authentication,
            @Valid @RequestBody ResetPasswordRequest body) {

        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String firebaseUid = authentication.getPrincipal().toString();
        passwordResetService.updatePassword(firebaseUid, body.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    /**
     * GET /api/auth/check-verification
     * Uses Firebase Admin SDK to definitively check if the user's email is verified.
     * This bypasses any client-side Firebase SDK caching issues that can cause
     * emailVerified to not update via reload() for minutes.
     * The backend Admin SDK always returns the authoritative source of truth.
     */
    @GetMapping("/check-verification")
    public ResponseEntity<?> checkVerification(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String firebaseUid = authentication.getPrincipal().toString();
        System.out.println("[VerificationCheck] Initiating lookup for UID: " + firebaseUid);

        try {
            UserRecord userRecord = FirebaseAuth.getInstance().getUser(firebaseUid);
            boolean verified = userRecord.isEmailVerified();
            System.out.println("[VerificationCheck] UID: " + firebaseUid + " | Firebase Admin says: " + (verified ? "VERIFIED" : "NOT VERIFIED"));
            return ResponseEntity.ok(Map.of("verified", verified));
        } catch (FirebaseAuthException e) {
            System.err.println("[VerificationCheck] Firebase Admin lookup failed for UID: " + firebaseUid + " | " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to check verification status",
                "details", e.getMessage(),
                "errorCode", e.getErrorCode() != null ? e.getErrorCode() : "UNKNOWN"
            ));
        }
    }

    @GetMapping("/avatars")
    public ResponseEntity<?> getAvatarOptions() {
        return ResponseEntity.ok(Map.of("avatars", List.of(
            "/avatars/avatar1.png",
            "/avatars/avatar2.png",
            "/avatars/avatar3.png",
            "/avatars/avatar4.png"
        )));
    }

    // ── inner request records ────────────────────────────────────────────────

    /** Fix #3: validated inner DTO for forgot-password */
    @lombok.Data
    public static class ForgotPasswordRequest {
        @jakarta.validation.constraints.NotBlank(message = "Email is required")
        @jakarta.validation.constraints.Email(message = "Must be a valid email address")
        private String email;
    }

    /** Fix #3: validated inner DTO for reset-password */
    @lombok.Data
    public static class ResetPasswordRequest {
        @jakarta.validation.constraints.NotBlank(message = "New password is required")
        @jakarta.validation.constraints.Size(min = 8, message = "Password must be at least 8 characters")
        private String newPassword;
    }
}
