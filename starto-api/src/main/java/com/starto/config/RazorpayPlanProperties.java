package com.starto.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Razorpay configuration properties.
 * CRITICAL: Fields must be initialized with default objects to prevent NullPointerException
 * when configuration binding fails or environment variables are not set.
 */
@Data
@Component
@ConfigurationProperties(prefix = "razorpay")
public class RazorpayPlanProperties {

    // Initialize with default objects - NEVER leave these null
    private Key key = new Key();
    private Plans plans = new Plans();

    @Data
    public static class Key {
        private String id = "dummy_key_id";
        private String secret = "dummy_key_secret";
    }

    @Data
    public static class Plans {
        private String trial = "plan_dummy_trial";
        private String sprint = "plan_dummy_sprint";
        private String boost = "plan_dummy_boost";
        private String pro = "plan_dummy_pro";
        private String captain = "plan_dummy_captain";
        private String captainPro = "plan_dummy_captain_pro";
        private String proPlus = "plan_dummy_pro_plus";
        private String growth = "plan_dummy_growth";
        private String annual = "plan_dummy_annual";
    }

    // DO NOT add @PostConstruct methods that access these fields
    // Spring Boot will properly bind configuration values after construction
}
