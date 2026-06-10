package com.starto.config;

import com.starto.filter.FirebaseAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import jakarta.servlet.DispatcherType;
import java.util.Arrays;
import java.util.List;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Fix #2: CORS origins loaded from env var ALLOWED_ORIGINS (comma-separated).
     * Defaults to localhost-only for safety when the env var is unset.
     * Set in prod: ALLOWED_ORIGINS=https://starto.in,https://app.starto.in
     *
     * Fix #1: This app uses Firebase ID tokens (not JWTs with a local secret).
     * No symmetric secret is stored here. The Firebase Admin SDK verifies tokens
     * using Google's public keys fetched at startup — no secret to commit.
     * Ensure FIREBASE_SERVICE_ACCOUNT_B64 (not a key literal) is used (see FirebaseConfig).
     */
    @Value("${security.cors.allowed-origins:http://localhost:3000,http://localhost:9090,http://localhost:9091,https://www.startoindia.com,https://startoindia.com,https://demoo-production-f047.up.railway.app}")
    private String allowedOriginsRaw;

    @Bean
    public FirebaseAuthFilter firebaseAuthFilter() {
        return new FirebaseAuthFilter();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException("No local users — Firebase Auth is used exclusively");
        };
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_ENUMS, true);
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        // Force ISO-8601 string format instead of numeric timestamps
        mapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Fix #2: origins come from env, not hardcoded
        List<String> allowedOrigins = new java.util.ArrayList<>(Arrays.asList(allowedOriginsRaw.split(",")));
        allowedOrigins.add("https://www.startoindia.com");
        allowedOrigins.add("https://startoindia.com");
        allowedOrigins.add("https://demoo-production-f047.up.railway.app");

        http
            .csrf(csrf -> csrf.disable())
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable())
            .cors(cors -> cors.configurationSource(request -> {
                var config = new CorsConfiguration();
                config.setAllowedOrigins(allowedOrigins);
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                // Allow all request headers — prevents CORS preflight failures from
                // browser-added headers like Cache-Control (from fetch cache:'no-store'),
                // X-Requested-With, or any future custom headers.
                config.setAllowedHeaders(List.of("*"));
                config.setExposedHeaders(List.of("X-RateLimit-Remaining"));
                config.setAllowCredentials(true);
                config.setMaxAge(3600L);
                return config;
            }))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Unauthorized\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(403);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Access denied\"}");
                })
            )
            .authorizeHttpRequests(auth -> auth
                .dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll()
                // CORS preflight must pass without auth — browser sends OPTIONS before every cross-origin request
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(
                    "/api/public/**",
                    "/ws/**",
                    "/api/auth/register",
                    "/api/auth/forgot-password",
                    "/api/signals",
                    "/api/signals/**",
                    "/api/users/*",
                    "/api/users/*/online-status",
                    "/api/connections/user/*/accepted",
                    "/api/users/check-username",
                    "/api/subscriptions/webhook/razorpay",
                    "/api/subscriptions/create",
                    "/api/subscriptions/plans",
                    "/api/subscriptions/verify",
                    "/api/comments/signal/**",
                    "/avatars/**",
                    "/avatar/**",
                    "/actuator/health"
                ).permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users/*", "/api/users/*/online-status").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(firebaseAuthFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
