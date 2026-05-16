package com.starto.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "razorpay")
public class RazorpayPlanProperties {

    private Key key = new Key();
    private Plans plans = new Plans();

    @Data
    public static class Key {
        private String id = "dummy";
        private String secret = "dummy";
    }

    @Data
    public static class Plans {
        private String trial = "plan_dummy";
        private String sprint = "plan_dummy";
        private String boost = "plan_dummy";
        private String pro = "plan_dummy";
        private String captain = "plan_dummy";
        private String captainPro = "plan_dummy";
        private String proPlus = "plan_dummy";
        private String growth = "plan_dummy";
        private String annual = "plan_dummy";
    }
}
