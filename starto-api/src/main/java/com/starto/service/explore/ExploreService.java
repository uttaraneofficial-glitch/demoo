package com.starto.service.explore;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.starto.dto.ExploreRequest;
import com.starto.dto.ExploreResponse;
import com.starto.model.AiUsage;
import com.starto.model.ExploreReport;
import com.starto.model.User;
import com.starto.repository.AiUsageRepository;
import com.starto.repository.ExploreReportRepository;
import com.starto.repository.UserRepository;
import com.starto.service.explore.LocationService;
import com.starto.service.manager.AIManager;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import com.starto.service.WebSocketService;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.UUID;
import java.time.LocalDate;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExploreService {

    private final AIManager aiManager;
    private final LocationService locationService;
    private final WebSocketService webSocketService;
    private final AiUsageRepository aiUsageRepository;
    private final ExploreReportRepository exploreReportRepository;
    private final UserRepository userRepository;

    @Cacheable(
        value = "exploreCache",
        key = "#request.location + '-' + #request.industry + '-' + #request.stage",
        unless = "#result == null || #result.marketDemand == null || 'N/A'.equals(#result.marketDemand.growthIndex)"
    )
    public ExploreResponse analyzeMarket(ExploreRequest request, String userId) {
        System.out.println("ANALYZE MARKET CALLED");
        try {
            webSocketService.send("/topic/explore/" + userId,
                    Map.of("status", "started", "message", "Fetching location data...", "progress", 10));

            String locationData = locationService.getInsights(request.getLocation());
            System.out.println("LOCATION DATA: " + locationData);

            webSocketService.send("/topic/explore/" + userId,
                    Map.of("status", "processing", "message", "Analyzing market with AI...", "progress", 40));

            String prompt = buildGptPrompt(request, locationData);
            System.out.println("PROMPT BUILT");

            webSocketService.send("/topic/explore/" + userId,
                    Map.of("status", "processing", "message", "Generating insights...", "progress", 70));

            String aiResponse = aiManager.analyzeWithFallback(prompt).get();
            System.out.println("AI RESPONSE: " + aiResponse);

            webSocketService.send("/topic/explore/" + userId,
                    Map.of("status", "complete", "message", "Analysis complete!", "progress", 100));

            ExploreResponse response = parse(aiResponse, aiResponse);
            
            // FETCH REAL COMPETITORS FROM GOOGLE MAPS
            try {
                List<ExploreResponse.Competitor> realCompetitors = locationService.getCompetitors(request.getIndustry(), request.getLocation());
                if (realCompetitors != null && !realCompetitors.isEmpty()) {
                    response.setCompetitors(realCompetitors);
                    System.out.println("INJECTED " + realCompetitors.size() + " REAL COMPETITORS FROM GOOGLE MAPS");
                } else {
                    response.setCompetitors(new java.util.ArrayList<>());
                }
            } catch (Exception e) {
                log.warn("Failed to inject real competitors", e);
            }

            // SAVE TO DB
            try {
                User user = userRepository.findById(UUID.fromString(userId)).orElse(null);
                if (user != null) {
                    ObjectMapper mapper = new ObjectMapper();
                    String fullJson = mapper.writeValueAsString(response);
                    
                    ExploreReport report = ExploreReport.builder()
                            .user(user)
                            .location(request.getLocation())
                            .industry(request.getIndustry())
                            .budget(request.getBudget())
                            .stage(request.getStage())
                            .targetCustomer(request.getTargetCustomer())
                            .reportData(fullJson)
                            .build();
                    
                    exploreReportRepository.save(report);
                    log.info("Explore report saved for user: {}", userId);
                }
            } catch (Exception e) {
                log.error("Failed to save explore report", e);
            }

            return response;

        } catch (Exception e) {
            System.out.println("ANALYZE EXCEPTION: " + e.getMessage());
            webSocketService.send("/topic/explore/" + userId,
                    Map.of("status", "error", "message", "Analysis failed", "progress", 0));
            e.printStackTrace();
            return ExploreResponse.builder().confidenceScore(0.0).build();
        }
    }

    private String buildGptPrompt(ExploreRequest req, String locationData) {
        return "You are an elite, senior-level market analyst and startup advisor. Analyze the market for a " + req.getIndustry() +
                " startup in " + req.getLocation() +
                " with a budget of " + req.getBudget() +
                " at " + req.getStage() + " stage. " +
                "Target customer: " + req.getTargetCustomer() + ". " +
                "Location context: " + locationData + ".\n\n" +
                "CRITICAL INSTRUCTION: Your insights MUST be senior-level, extremely valuable, and highly strategic to justify a premium subscription. " +
                "HOWEVER, you must write in incredibly simple, crystal-clear, jargon-free English (8th-grade reading level) so that absolutely anyone, from uneducated to highly educated, can perfectly understand and execute your plan. Be brutally honest, avoid generic advice, and provide highly specific, actionable, and viral-worthy insights.\n\n" +
                "IMPORTANT: Provide REAL and VALID government schemes, subsidies, or policies available for this specific industry and location. Do not hallucinate.\n\n" +
                "Return ONLY a valid JSON object with the following structure (no other text, no markdown):\n" +
                "{\n" +
                "  \"marketDemand\": {\n" +
                "    \"score\": 8, // Integer between 1-10. Must be dynamic and brutally realistic based on actual data, do not always output 7\n" +
                "    \"marketSummary\": \"A clear, simple, senior-level strategic summary of why the demand is high or low (written like a brilliant mentor talking to a founder in plain English)\",\n" +
                "    \"drivers\": [\"driver1\", \"driver2\"],\n" +
                "    \"sources\": [\"source1\", \"source2\"]\n" +
                "  },\n" +
                "  \"competitors\": [], // Leave empty. Competitors are fetched from real-time data.\n" +
                "  \"risks\": [{\"title\": \"\", \"description\": \"\", \"severity\": \"LOW|MEDIUM|HIGH\", \"mitigation\": \"\"}],\n" +
                "  \"budgetFeasibility\": {\"canBuild\": [\"item1\", \"item2\"], \"actualNeed\": [\"item1\", \"item2\"], \"verdict\": \"Feasible|Tight|Infeasible\"},\n" +
                "  \"governmentSchemes\": [{\"name\": \"Name of scheme\", \"body\": \"Governing body\", \"benefits\": \"Detailed benefits\", \"eligibility\": \"Who can apply\", \"applyUrl\": \"Official link if known\"}],\n" +
                "  \"actionPlan\": [\n" +
                "    {\"range\": \"Month 1: Foundation\", \"tasks\": [\"task1\", \"task2\"]},\n" +
                "    {\"range\": \"Month 2: Execution\", \"tasks\": [\"task3\", \"task4\"]},\n" +
                "    {\"range\": \"Month 3: Launch\", \"tasks\": [\"task5\", \"task6\"]}\n" +
                "  ]\n" +
                "}";
    }

    private ExploreResponse parse(String rawResponse, String gemini) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(rawResponse);

            String content = null;

            if (root.has("choices")) {
                content = root.get("choices").get(0)
                        .get("message")
                        .get("content")
                        .asText();
            } else if (root.has("candidates")) {
                content = root.get("candidates").get(0)
                        .get("content")
                        .get("parts").get(0)
                        .get("text")
                        .asText();
            } else {
                content = rawResponse;
            }

            content = content.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode data = mapper.readTree(content);

            ExploreResponse.MarketDemand marketDemand = new ExploreResponse.MarketDemand();
            if (data.has("marketDemand")) {
                JsonNode md = data.get("marketDemand");
                marketDemand.setScore(md.has("score") ? md.get("score").asInt(7) : 7);
                marketDemand.setGrowthIndex(md.has("growthIndex") ? md.get("growthIndex").asText() : "+10% MoM");
                marketDemand.setMarketSaturation(md.has("marketSaturation") ? md.get("marketSaturation").asText() : "Medium");
                marketDemand.setMarketSummary(md.has("marketSummary") ? md.get("marketSummary").asText() : "Market shows interesting growth potential.");
                marketDemand.setDrivers(md.has("drivers")
                        ? mapper.convertValue(md.get("drivers"), mapper.getTypeFactory().constructCollectionType(List.class, String.class))
                        : List.of("Market Growth"));
                marketDemand.setSources(md.has("sources")
                        ? mapper.convertValue(md.get("sources"), mapper.getTypeFactory().constructCollectionType(List.class, String.class))
                        : List.of("AI Insights"));
            } else {
                marketDemand.setScore(data.has("marketDemandScore") ? data.get("marketDemandScore").asInt(7) : 7);
                marketDemand.setDrivers(List.of("General growth"));
                marketDemand.setSources(List.of("Starto AI"));
            }

            List<ExploreResponse.Competitor> competitors = data.has("competitors")
                    ? mapper.convertValue(data.get("competitors"),
                        mapper.getTypeFactory().constructCollectionType(List.class, ExploreResponse.Competitor.class))
                    : List.of();

            List<ExploreResponse.Risk> risks = data.has("risks")
                    ? mapper.convertValue(data.get("risks"),
                        mapper.getTypeFactory().constructCollectionType(List.class, ExploreResponse.Risk.class))
                    : List.of();

            ExploreResponse.BudgetFeasibility budgetFeasibility = null;
            if (data.has("budgetFeasibility")) {
                JsonNode bf = data.get("budgetFeasibility");
                budgetFeasibility = new ExploreResponse.BudgetFeasibility();
                budgetFeasibility.setVerdict(bf.has("verdict") ? bf.get("verdict").asText() : "Unknown");
                budgetFeasibility.setCanBuild(bf.has("canBuild")
                        ? mapper.convertValue(bf.get("canBuild"),
                            mapper.getTypeFactory().constructCollectionType(List.class, String.class))
                        : List.of());
                budgetFeasibility.setActualNeed(bf.has("actualNeed")
                        ? mapper.convertValue(bf.get("actualNeed"),
                            mapper.getTypeFactory().constructCollectionType(List.class, String.class))
                        : List.of());
            }

            List<ExploreResponse.GovernmentScheme> governmentSchemes = data.has("governmentSchemes")
                    ? mapper.convertValue(data.get("governmentSchemes"),
                        mapper.getTypeFactory().constructCollectionType(List.class, ExploreResponse.GovernmentScheme.class))
                    : List.of();

            List<ExploreResponse.ActionPhase> actionPlan = data.has("actionPlan")
                    ? mapper.convertValue(data.get("actionPlan"),
                        mapper.getTypeFactory().constructCollectionType(List.class, ExploreResponse.ActionPhase.class))
                    : List.of();

            return ExploreResponse.builder()
                    .marketDemand(marketDemand)
                    .competitors(competitors)
                    .risks(risks)
                    .budgetFeasibility(budgetFeasibility)
                    .governmentSchemes(governmentSchemes)
                    .actionPlan(actionPlan)
                    .confidenceScore(0.9)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse AI response: {}", e.getMessage());
            return ExploreResponse.builder().confidenceScore(0.5).build();
        }
    }

    public int getTodayUsage(UUID userId) {
        return aiUsageRepository
                .findByUserIdAndDate(userId, LocalDate.now())
                .map(AiUsage::getUsedCount)
                .orElse(0);
    }

    public int getTotalUsage(UUID userId) {
        return aiUsageRepository.getTotalUsageByUserId(userId);
    }

@Transactional
public void incrementUsage(UUID userId) {

    LocalDate today = LocalDate.now();

    AiUsage usage = aiUsageRepository
            .findByUserIdAndDate(userId, today)
            .orElse(
                AiUsage.builder()
                        .userId(userId)
                        .date(today)
                        .usedCount(0)
                        .build()
            );

    usage.setUsedCount(usage.getUsedCount() + 1);

    aiUsageRepository.save(usage);
}

    public List<ExploreReport> getReports(UUID userId) {
        return exploreReportRepository.findByUserId(userId);
    }
}
