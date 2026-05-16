package com.starto.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

@Data
@Component
@ConfigurationProperties(prefix = "razorpay")
public class RazorpayPlanProperties {

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

    @PostConstruct
    public void init() {
        if (this.plans == null) {
            this.plans = new Plans();
        }
        if (this.key == null) {
            this.key = new Key();
        }
        System.out.println("SPRING CONFIG LOADED:");
        System.out.println("CAPTAIN PLAN = " + plans.getCaptain());
    }
}
