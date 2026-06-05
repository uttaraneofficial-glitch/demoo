package com.starto.service.external;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleMapsClient {

    private final WebClient webClient = WebClient.create();

    @Value("${google.maps.api-key}")
    private String apiKey;

    public String fetchInsights(String location) {

        String url = "https://maps.googleapis.com/maps/api/place/textsearch/json?query="
                + location + "&key=" + apiKey;

        try {
            String response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5)) //  faster timeout
                    .block();

            return response;

        } catch (Exception e) {
            log.warn("Google Maps API failed", e);
            return "Location data unavailable";
        }
    }

    public java.util.List<com.starto.dto.ExploreResponse.Competitor> fetchCompetitors(String industry, String location) {
        String encodedQuery = "";
        try {
            encodedQuery = java.net.URLEncoder.encode(industry + " in " + location, java.nio.charset.StandardCharsets.UTF_8.toString());
        } catch (Exception e) {
            encodedQuery = (industry + " in " + location).replace(" ", "%20");
        }
        
        String url = "https://maps.googleapis.com/maps/api/place/textsearch/json?query="
                + encodedQuery + "&key=" + apiKey;
                
        System.out.println("[GoogleMapsClient] Fetching competitors with URL: " + url.replace(apiKey, "HIDDEN"));

        java.util.List<com.starto.dto.ExploreResponse.Competitor> competitors = new java.util.ArrayList<>();
        try {
            String response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(response);
            
            if (root.has("results")) {
                int count = 0;
                for (com.fasterxml.jackson.databind.JsonNode node : root.get("results")) {
                    if (count >= 20) break; // limit to 20 competitors
                    
                    com.starto.dto.ExploreResponse.Competitor c = new com.starto.dto.ExploreResponse.Competitor();
                    c.setName(node.has("name") ? node.get("name").asText() : "Unknown");
                    c.setLocation(node.has("formatted_address") ? node.get("formatted_address").asText() : 
                                  (node.has("vicinity") ? node.get("vicinity").asText() : location));
                    
                    double rating = node.has("rating") ? node.get("rating").asDouble() : 0.0;
                    int reviews = node.has("user_ratings_total") ? node.get("user_ratings_total").asInt() : 0;
                    
                    c.setDescription("Rating: " + rating + " ⭐ (" + reviews + " reviews). Real business found via Google Maps.");
                    c.setStage("Active");
                    
                    // Simple logic for threat level based on reviews/rating
                    if (reviews > 500 && rating >= 4.0) c.setThreatLevel("HIGH");
                    else if (reviews > 100) c.setThreatLevel("MEDIUM");
                    else c.setThreatLevel("LOW");
                    
                    competitors.add(c);
                    count++;
                }
            }
        } catch (Exception e) {
            log.warn("Google Maps API competitors fetch failed", e);
        }
        return competitors;
    }
}
