package com.starto.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.config-base64:}")
    private String configBase64;

    @Value("${firebase.service-account-b64:}")
    private String serviceAccountB64;

    @Value("${firebase.config-path:}")
    private String configPath;

    @PostConstruct
    public void init() throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            return;
        }

        String effectiveB64 = StringUtils.hasText(configBase64)
                ? configBase64 : serviceAccountB64;

        if (!StringUtils.hasText(effectiveB64) &&
            !StringUtils.hasText(configPath)) {
            System.out.println("WARNING: Firebase not configured - " +
                "set FIREBASE_SERVICE_ACCOUNT_B64. Skipping init.");
            return;
        }

        InputStream serviceAccount;

        if (StringUtils.hasText(effectiveB64)) {
            try {
                byte[] decoded = Base64.getDecoder()
                    .decode(effectiveB64.trim());
                serviceAccount = new ByteArrayInputStream(decoded);
            } catch (IllegalArgumentException e) {
                System.out.println("WARNING: Invalid Firebase base64 - " +
                    "skipping Firebase init: " + e.getMessage());
                return;
            }
        } else {
            serviceAccount = new FileInputStream(configPath);
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

        FirebaseApp.initializeApp(options);
        System.out.println("Firebase initialised: " +
            FirebaseApp.getApps().size() + " app(s)");
    }
}
