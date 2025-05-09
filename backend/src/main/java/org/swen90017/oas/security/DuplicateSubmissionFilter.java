package org.swen90017.oas.security;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * This filter is responsible for preventing duplicate submissions by verifying unique tokens.
 */
public class DuplicateSubmissionFilter extends OncePerRequestFilter {

    // Cache to store and verify request tokens
    private final ConcurrentHashMap<String, Boolean> submissionCache = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // Retrieve the token from the request header
        String token = request.getHeader("X-CSRF-TOKEN");

        if (token != null) {
            // Check if the token is a duplicate
            if (submissionCache.putIfAbsent(token, true) != null) {
                // If the token already exists, block the request
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("Duplicate submission detected");
                return;
            }
        }

        // Continue with the filter chain
        filterChain.doFilter(request, response);

        // Remove the token after processing to prevent memory leaks
        if (token != null) {
            submissionCache.remove(token);
        }
    }
}

