package org.swen90017.oas.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import javax.servlet.ServletInputStream;
import javax.servlet.http.HttpServletRequest;
import org.apache.commons.text.StringEscapeUtils;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;


// This request wrapper sanitizes the request parameters and JSON payloads to prevent XSS attacks
// while allowing certain HTTP methods and URLs to be skipped.
public class XSSRequestWrapper extends CachingRequestWrapper {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Set of allowed methods to skip XSS filtering
    private static final Set<String> ALLOWED_METHODS = new HashSet<>();

    static {
        ALLOWED_METHODS.add("GET");
        ALLOWED_METHODS.add("DELETE");
    }

    // Set of URLs to skip XSS filtering
    private final Set<String> skipUrls = new HashSet<>();

    public XSSRequestWrapper(HttpServletRequest request) {
        super(request);
        initializeSkipUrls();
    }

    // Initialize the list of URLs to skip XSS filtering.
    private void initializeSkipUrls() {
        // Add URLs to be skipped here
        skipUrls.add("");
    }

    @Override
    public String getParameter(String name) {
        if (shouldSkipFiltering()) {
            return super.getParameter(name);
        }
        String value = super.getParameter(name);
        return sanitize(value);
    }

    @Override
    public String[] getParameterValues(String name) {
        if (shouldSkipFiltering()) {
            return super.getParameterValues(name);
        }
        String[] values = super.getParameterValues(name);
        if (values == null) {
            return null;
        }
        for (int i = 0; i < values.length; i++) {
            values[i] = sanitize(values[i]);
        }
        return values;
    }

    @Override
    public ServletInputStream getInputStream() throws IOException {
        // If the request does not require filtering or the Content-Type is not JSON, use parent implementation
        String contentType = getContentType();
        if (shouldSkipFiltering() || contentType == null || !contentType.toLowerCase().contains("application/json")) {
            return super.getInputStream();
        }

        // Get cached body and apply XSS filtering for JSON payloads
        String originalBody = getCachedBody();
        String sanitizedBody = sanitizeJson(originalBody);
        
        // Update cached body with sanitized content
        setCachedBody(sanitizedBody);
        
        // Return input stream with sanitized content
        return super.getInputStream();
    }


    // Checks if the request should bypass XSS filtering.
    private boolean shouldSkipFiltering() {
        // Check if HTTP method is in the allowed list
        if (ALLOWED_METHODS.contains(this.getMethod())) {
            return true;
        }

        // Check if request URI is in the skip URL paths
        String requestUri = this.getRequestURI();
        if (skipUrls.contains(requestUri)) {
            return true;
        }

        // Default behavior: Do not skip filtering
        return false;
    }

    private String sanitize(String value) {
        return value == null ? null : StringEscapeUtils.escapeHtml4(value);
    }

    private String sanitizeJson(String jsonInput) {
        try {
            JsonNode jsonNode = objectMapper.readTree(jsonInput);
            sanitizeJsonNode(jsonNode);
            return objectMapper.writeValueAsString(jsonNode);
        } catch (IOException e) {
            return StringEscapeUtils.escapeHtml4(jsonInput);
        }
    }

    private void sanitizeJsonNode(JsonNode jsonNode) {
        if (jsonNode.isObject()) {
            jsonNode.fields().forEachRemaining(entry -> {
                JsonNode child = entry.getValue();
                if (child.isValueNode() && child.isTextual()) {
                    ((com.fasterxml.jackson.databind.node.ObjectNode) jsonNode)
                            .put(entry.getKey(), sanitize(child.asText()));
                } else {
                    sanitizeJsonNode(child);
                }
            });
        } else if (jsonNode.isArray()) {
            for (JsonNode child : jsonNode) {
                sanitizeJsonNode(child);
            }
        }
    }

}