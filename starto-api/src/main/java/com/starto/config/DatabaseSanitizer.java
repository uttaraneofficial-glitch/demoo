package com.starto.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class DatabaseSanitizer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            System.out.println("[DatabaseSanitizer] Starting database sanity checks...");

            // 1. Find duplicated usernames
            String findDuplicatesSql = "SELECT username FROM users GROUP BY username HAVING COUNT(username) > 1";
            List<String> duplicateUsernames = jdbcTemplate.queryForList(findDuplicatesSql, String.class);

            if (!duplicateUsernames.isEmpty()) {
                System.out.println("[DatabaseSanitizer] Found " + duplicateUsernames.size() + " duplicate usernames. Resolving...");
                
                for (String duplicateUsername : duplicateUsernames) {
                    // Get all IDs for this duplicate username
                    List<String> ids = jdbcTemplate.queryForList(
                        "SELECT id FROM users WHERE username = ?",
                        String.class,
                        duplicateUsername
                    );
                    
                    // Skip the first one, update the rest with a random suffix
                    for (int i = 1; i < ids.size(); i++) {
                        String newUsername = duplicateUsername + "_" + UUID.randomUUID().toString().substring(0, 4);
                        jdbcTemplate.update(
                            "UPDATE users SET username = ? WHERE id = ?::uuid",
                            newUsername,
                            ids.get(i)
                        );
                        System.out.println("[DatabaseSanitizer] Renamed duplicate user " + ids.get(i) + " to " + newUsername);
                    }
                }
            }

            // 2. Safely add the unique constraint if it doesn't exist
            try {
                // This checks if the constraint exists in Postgres
                String checkConstraintSql = "SELECT count(*) FROM pg_constraint WHERE conname = 'uk_username'";
                Integer count = jdbcTemplate.queryForObject(checkConstraintSql, Integer.class);
                
                if (count != null && count == 0) {
                    System.out.println("[DatabaseSanitizer] Unique constraint 'uk_username' missing. Adding it now to enforce absolute data integrity...");
                    jdbcTemplate.execute("ALTER TABLE users ADD CONSTRAINT uk_username UNIQUE (username)");
                    System.out.println("[DatabaseSanitizer] Unique constraint added successfully.");
                } else {
                    System.out.println("[DatabaseSanitizer] Unique constraint 'uk_username' already exists. Safe.");
                }
            } catch (Exception e) {
                System.err.println("[DatabaseSanitizer] Could not add unique constraint automatically. You may need to run it manually: ALTER TABLE users ADD CONSTRAINT uk_username UNIQUE(username); Error: " + e.getMessage());
            }

        } catch (Exception e) {
            System.err.println("[DatabaseSanitizer] Error during startup sanitization: " + e.getMessage());
        }
    }
}
