package com.starto.controller;

import com.starto.model.EventStartup;
import com.starto.repository.EventStartupRepository;
import com.starto.model.User;
import com.starto.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/startups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EventStartupController {

    private final EventStartupRepository repository;
    private final UserService userService;

    private static final String ADMIN_EMAIL = "krishnamurthikm07@gmail.com";

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return false;
        }
        String firebaseUid = authentication.getPrincipal().toString();
        User currentUser = userService.getUserByFirebaseUid(firebaseUid).orElse(null);
        return currentUser != null && ADMIN_EMAIL.equalsIgnoreCase(currentUser.getEmail());
    }

    // Public endpoint
    @GetMapping
    public ResponseEntity<List<EventStartup>> getAll() {
        return ResponseEntity.ok(repository.findAll());
    }

    // Public endpoint
    @GetMapping("/{slug}")
    public ResponseEntity<?> getBySlug(@PathVariable String slug) {
        return repository.findBySlug(slug)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Admin endpoint
    @PostMapping
    public ResponseEntity<?> create(@RequestBody EventStartup startup, Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).body("Forbidden: Admin access required.");
        }
        try {
            return ResponseEntity.ok(repository.save(startup));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // Admin endpoint
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody EventStartup updatedStartup, Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).body("Forbidden: Admin access required.");
        }
        return repository.findById(id).map(existing -> {
            existing.setName(updatedStartup.getName());
            existing.setSlug(updatedStartup.getSlug());
            existing.setIndustry(updatedStartup.getIndustry());
            existing.setCity(updatedStartup.getCity());
            existing.setTagline(updatedStartup.getTagline());
            existing.setMission(updatedStartup.getMission());
            existing.setViksitBharatContribution(updatedStartup.getViksitBharatContribution());
            existing.setWebsite(updatedStartup.getWebsite());
            existing.setLogoUrl(updatedStartup.getLogoUrl());
            existing.setCoverUrl(updatedStartup.getCoverUrl());
            return ResponseEntity.ok(repository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Admin endpoint
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).body("Forbidden: Admin access required.");
        }
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.ok("Deleted");
        }
        return ResponseEntity.notFound().build();
    }
}
