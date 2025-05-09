package org.swen90017.oas.security;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

/**
 * This filter is responsible for preventing XSS attacks by sanitizing input parameters.
 */
public class XSSFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // Wrap the request with XSS protection logic
        XSSRequestWrapper xssRequestWrapper = new XSSRequestWrapper(request);

        // Continue with the filter chain
        filterChain.doFilter(xssRequestWrapper, response);
    }
}

