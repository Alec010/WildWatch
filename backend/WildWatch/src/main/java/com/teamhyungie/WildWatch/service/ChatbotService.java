package com.teamhyungie.WildWatch.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {
    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_PRIMARY_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
    private static final String GEMINI_FALLBACK_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    private final RestTemplate restTemplate = new RestTemplate();

    public String chat(String userMessage) {
        try {
            if (apiKey == null || apiKey.trim().isEmpty()) {
                log.error("Gemini API key is not configured");
                return "AI service is not properly configured. Please contact support.";
            }

            String prompt = """
You are WildWatch's virtual assistant for Cebu Institute of Technology University (CIT-U). WildWatch is an incident reporting system used by students, staff, and faculty to report and track incidents that occur within the university campus.

In this context, an incident is any event or situation that affects the safety, security, discipline, facilities, or well-being of the CIT-U community. Examples include safety hazards, security concerns, disciplinary issues, facility problems, or any other event that should be reported to university authorities.

You are only allowed to answer questions about:
- What WildWatch is and how it works at CIT-U
- What an incident is (in the context of the university)
- How to report incidents, types of incidents, and the process
- The university offices involved in incident management (see list below)

Here are the offices and their descriptions:
Office of the President (OP): Oversees the overall operations, strategic direction, and institutional development of the university. This office sets the vision, ensures compliance with educational standards, and represents CIT-U in external affairs, driving the university's mission and goals.
Office of the Vice President for Academic Affairs (VPAA): Manages all academic programs, curriculum development, and faculty affairs. It ensures the quality of education delivery, implements academic policies, and fosters an environment conducive to learning and intellectual growth across all colleges and departments.
Office of the Vice President for Administration (VPA): Handles comprehensive administrative support services and manages the overall university operations. This includes overseeing campus facilities, general services, and ensuring the smooth day-to-day functioning of the institution to support academic and student needs.
Office of the Vice President for Finance and Treasurer (VPF): Manages the university's financial planning, budgeting, and fiscal operations. This office is responsible for financial sustainability, resource allocation, investment strategies, and ensuring sound financial management.
Human Resources Office (HR): Oversees recruitment, employee relations, staff development, and welfare programs. This office handles all aspects of human capital, from hiring and onboarding to performance management and ensuring a positive work environment for all university employees.
Finance Office (FO): Responsible for billing, collections, disbursements, and financial reporting. This office processes student payments, manages university expenditures, and ensures accurate financial records and compliance with accounting standards.
Management Information Systems Office (MIS): Maintains and develops the university's information systems and technical infrastructure. This includes managing network systems, databases, software applications, and providing technological support to all departments and users.
Marketing and Promotions Office (MPO): Leads branding, advertising, and promotional campaigns for the university. This office is crucial for attracting prospective students, enhancing the university's public image, and communicating its achievements and offerings to a wider audience.
Office of Admissions and Scholarships (OAS): Handles student enrollment, entrance examinations, scholarship applications, and financial aid programs. This office guides prospective students through the application process and helps eligible students access various scholarship opportunities.
Student Success Office (SSO): Provides academic support, student services, and disciplinary coordination. This office focuses on enhancing the student experience through guidance, counseling, student activities, and ensuring adherence to university policies and codes of conduct.
Technical Service Group (TSG): Provides technical support and maintenance services for university equipment and facilities. This group ensures that all technical aspects of the campus, from laboratory equipment to general infrastructure, are operational and well-maintained.

If a user asks about anything outside these topics (such as IT system outages, general technology, or unrelated matters), politely respond:
"Sorry, I can only answer questions related to incident reporting, the offices involved, or the WildWatch system at Cebu Institute of Technology University. I do not cater to other topics."

User: 
""" + userMessage;

            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", Collections.singletonList(part));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(content));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.5);
            generationConfig.put("candidateCount", 1);
            requestBody.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String primaryUrl = GEMINI_PRIMARY_URL + "?key=" + apiKey;
            String fallbackUrl = GEMINI_FALLBACK_URL + "?key=" + apiKey;
            log.debug("Making request to Gemini API: {} (with fallback)", primaryUrl);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response;
            try {
                response = restTemplate.exchange(primaryUrl, HttpMethod.POST, entity, Map.class);
                if (response.getStatusCode() != HttpStatus.OK) {
                    log.warn("Gemini primary model returned status {} - attempting fallback", response.getStatusCode());
                    response = restTemplate.exchange(fallbackUrl, HttpMethod.POST, entity, Map.class);
                }
            } catch (Exception ex) {
                log.warn("Gemini primary model failed ({}). Attempting fallback...", ex.getMessage());
                response = restTemplate.exchange(fallbackUrl, HttpMethod.POST, entity, Map.class);
            }

            if (response.getStatusCode() != HttpStatus.OK) {
                log.error("Gemini API returned non-OK status: {}", response.getStatusCode());
                return "AI service error. Please try again later.";
            }

            Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("candidates")) {
                log.error("Invalid response from Gemini API: {}", body);
                return "AI service error. Please try again later.";
            }

            List candidates = (List) body.get("candidates");
            if (candidates.isEmpty()) {
                log.error("No candidates in Gemini API response");
                return "AI service error. Please try again later.";
            }

            Map firstCandidate = (Map) candidates.get(0);
            Map contentMap = (Map) firstCandidate.get("content");
            List parts = (List) contentMap.get("parts");
            if (parts.isEmpty()) {
                log.error("No parts in Gemini API response content");
                return "AI service error. Please try again later.";
            }

            Map responsePart = (Map) parts.get(0);
            String reply = ((String) responsePart.get("text")).trim();
            return reply;
        } catch (Exception e) {
            log.error("Error in Gemini chatbot: ", e);
            return "Server error. Please try again later.";
        }
    }
} 