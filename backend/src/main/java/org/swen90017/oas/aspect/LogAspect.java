package org.swen90017.oas.aspect;

import java.lang.reflect.Method;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.utils.IpUtils;
import org.swen90017.oas.utils.ServletUtils;
import org.swen90017.oas.utils.StringUtils_ApacheLang3;

/**
 * Operation log recording processing aspect
 *
 * @author Yongchun Li
 */
@Aspect
@Component
public class LogAspect {
    private static final Logger log = LoggerFactory.getLogger(LogAspect.class);

    // ANSI color codes for console output
    private static final String ANSI_RESET = "\u001B[0m";
    private static final String ANSI_BOLD = "\u001B[1m";
    private static final String ANSI_RED = "\u001B[31m";
    private static final String ANSI_GREEN = "\u001B[32m";
    private static final String ANSI_YELLOW = "\u001B[33m";
    private static final String ANSI_BLUE = "\u001B[34m";
    private static final String ANSI_PURPLE = "\u001B[35m";
    private static final String ANSI_CYAN = "\u001B[36m";
    
    /**
     * Configure pointcut
     */
    @Pointcut("@annotation(org.swen90017.oas.annotation.Log)")
    public void logPointCut() {
    }

    /**
     * Execute after processing the request
     *
     * @param joinPoint JoinPoint
     */
    @Around("logPointCut()")
    public Object doAround(ProceedingJoinPoint joinPoint) throws Throwable {
        // Start time
        long startTime = System.currentTimeMillis();
        
        // Execute method
        Object result = joinPoint.proceed();
        
        // Execution duration (milliseconds)
        long time = System.currentTimeMillis() - startTime;
        
        // Record log
        recordRequestLog(joinPoint, time);
        
        return result;
    }

    /**
     * Intercept exception operation
     *
     * @param joinPoint JoinPoint
     * @param e         Exception
     */
    @AfterThrowing(value = "logPointCut()", throwing = "e")
    public void doAfterThrowing(JoinPoint joinPoint, Exception e) {
        recordExceptionLog(joinPoint, e);
    }

    /**
     * Record request log
     *
     * @param joinPoint JoinPoint
     * @param time      Execution time
     */
    private void recordRequestLog(JoinPoint joinPoint, long time) {
        try {
            // Get HttpServletRequest
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                return;
            }
            
            HttpServletRequest request = attributes.getRequest();
            
            // Get operation log annotation information
            Log logAnnotation = getLogAnnotation(joinPoint);
            if (logAnnotation == null) {
                return;
            }
            
            // Get current logged-in user information (if needed)
            // String username = getUsername();
            
            // Record request information
            String requestMethod = request.getMethod();
            String requestUrl = ServletUtils.getFullRequestUrl(request);
            String ipAddr = IpUtils.getIpAddr(request);
            String userAgent = request.getHeader("User-Agent");
            
            // Get module name
            String module = StringUtils_ApacheLang3.isEmpty(logAnnotation.module()) ? "" : logAnnotation.module();
            
            // Get operation type
            String operType = StringUtils_ApacheLang3.isEmpty(logAnnotation.operType()) ? "" : logAnnotation.operType();
            
            // Record method parameters
            String requestParams = "";
            if (logAnnotation.isSaveRequestData()) {
                requestParams = getRequestParams(joinPoint, request);
            }
            
            // Color for method based on request type
            String methodColor = ANSI_BLUE;
            if ("GET".equalsIgnoreCase(requestMethod)) {
                methodColor = ANSI_GREEN;
            } else if ("POST".equalsIgnoreCase(requestMethod)) {
                methodColor = ANSI_BLUE;
            } else if ("PUT".equalsIgnoreCase(requestMethod)) {
                methodColor = ANSI_YELLOW;
            } else if ("DELETE".equalsIgnoreCase(requestMethod)) {
                methodColor = ANSI_RED;
            } else if ("PATCH".equalsIgnoreCase(requestMethod)) {
                methodColor = ANSI_PURPLE;
            }
            
            // Color for execution time based on performance
            String timeColor = ANSI_GREEN;
            if (time > 500) {
                timeColor = ANSI_YELLOW;
            } else if (time > 2000) {
                timeColor = ANSI_RED;
            }
            
            // Create decorative output
            StringBuilder logBuilder = new StringBuilder();
            String separator = ANSI_YELLOW + "┌────────────────────────────────────────────────────────────────────────────────┐" + ANSI_RESET;
            String line = ANSI_YELLOW + "│" + ANSI_RESET;
            String bottomSeparator = ANSI_YELLOW + "└────────────────────────────────────────────────────────────────────────────────┘" + ANSI_RESET;
            String midSeparator = ANSI_YELLOW + "├────────────────────────────────────────────────────────────────────────────────┤" + ANSI_RESET;
            
            logBuilder.append("\n").append(separator).append("\n");
            logBuilder.append(line).append(" ").append(ANSI_BOLD).append(ANSI_YELLOW).append("📋 REQUEST LOG").append(ANSI_RESET).append(" - ").append(ANSI_BOLD).append(module).append(ANSI_RESET).append("\n");
            logBuilder.append(midSeparator).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Operation:").append(ANSI_RESET).append("  ").append(operType).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("IP:").append(ANSI_RESET).append("         ").append(ipAddr).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("URL:").append(ANSI_RESET).append("        ").append(requestUrl).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Method:").append(ANSI_RESET).append("     ").append(methodColor).append(requestMethod).append(ANSI_RESET).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("User-Agent:").append(ANSI_RESET).append(" ").append(userAgent).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Class:").append(ANSI_RESET).append("      ").append(joinPoint.getSignature().getDeclaringTypeName())
                    .append(".").append(joinPoint.getSignature().getName()).append("\n");
            
            if (StringUtils_ApacheLang3.isNotEmpty(requestParams)) {
                logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Parameters:").append(ANSI_RESET).append(" ").append(requestParams).append("\n");
            }
            
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Exec Time:").append(ANSI_RESET).append("  ").append(timeColor).append(time).append(" ms").append(ANSI_RESET).append("\n");
            logBuilder.append(bottomSeparator);
            
            log.info(logBuilder.toString());
            
            // Add log persistence logic here, such as saving logs to the database
        } catch (Exception ex) {
            log.error("Failed to record request log", ex);
        }
    }

    /**
     * Record exception log
     *
     * @param joinPoint JoinPoint
     * @param e         Exception
     */
    private void recordExceptionLog(JoinPoint joinPoint, Exception e) {
        try {
            // Get HttpServletRequest
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                return;
            }
            
            HttpServletRequest request = attributes.getRequest();
            
            // Get operation log annotation information
            Log logAnnotation = getLogAnnotation(joinPoint);
            if (logAnnotation == null) {
                return;
            }
            
            // Record request information
            String requestMethod = request.getMethod();
            String requestUrl = ServletUtils.getFullRequestUrl(request);
            String ipAddr = IpUtils.getIpAddr(request);
            
            // Get module name
            String module = StringUtils_ApacheLang3.isEmpty(logAnnotation.module()) ? "" : logAnnotation.module();
            
            // Get operation type
            String operType = StringUtils_ApacheLang3.isEmpty(logAnnotation.operType()) ? "" : logAnnotation.operType();
            
            // Record method parameters
            String requestParams = "";
            if (logAnnotation.isSaveRequestData()) {
                requestParams = getRequestParams(joinPoint, request);
            }
            
            // Create decorative output for exception
            StringBuilder logBuilder = new StringBuilder();
            String separator = ANSI_RED + "┌────────────────────────────────────────────────────────────────────────────────┐" + ANSI_RESET;
            String line = ANSI_RED + "│" + ANSI_RESET;
            String bottomSeparator = ANSI_RED + "└────────────────────────────────────────────────────────────────────────────────┘" + ANSI_RESET;
            String midSeparator = ANSI_RED + "├────────────────────────────────────────────────────────────────────────────────┤" + ANSI_RESET;
            
            logBuilder.append("\n").append(separator).append("\n");
            logBuilder.append(line).append(" ").append(ANSI_BOLD).append(ANSI_RED).append("❌ EXCEPTION").append(ANSI_RESET).append(" - ").append(ANSI_BOLD).append(module).append(ANSI_RESET).append("\n");
            logBuilder.append(midSeparator).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Operation:").append(ANSI_RESET).append("  ").append(operType).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("IP:").append(ANSI_RESET).append("         ").append(ipAddr).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("URL:").append(ANSI_RESET).append("        ").append(requestUrl).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Method:").append(ANSI_RESET).append("     ").append(requestMethod).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Class:").append(ANSI_RESET).append("      ").append(joinPoint.getSignature().getDeclaringTypeName())
                    .append(".").append(joinPoint.getSignature().getName()).append("\n");
            
            if (StringUtils_ApacheLang3.isNotEmpty(requestParams)) {
                logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Parameters:").append(ANSI_RESET).append(" ").append(requestParams).append("\n");
            }
            
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Exception:").append(ANSI_RESET).append("  ").append(ANSI_RED).append(e.getMessage()).append(ANSI_RESET).append("\n");
            logBuilder.append(bottomSeparator);
            
            log.error(logBuilder.toString(), e);
            
            // Add exception log persistence logic here
        } catch (Exception ex) {
            log.error("Failed to record exception log", ex);
        }
    }

    /**
     * Get operation annotation
     *
     * @param joinPoint JoinPoint
     * @return Operation annotation
     */
    private Log getLogAnnotation(JoinPoint joinPoint) {
        MethodSignature methodSignature = (MethodSignature) joinPoint.getSignature();
        Method method = methodSignature.getMethod();
        return method.getAnnotation(Log.class);
    }

    /**
     * Get request parameters
     *
     * @param joinPoint JoinPoint
     * @param request   Request object
     * @return Request parameters
     */
    private String getRequestParams(JoinPoint joinPoint, HttpServletRequest request) {
        String requestMethod = request.getMethod();
        StringBuilder params = new StringBuilder();
        
        // Process GET request parameters
        if ("GET".equalsIgnoreCase(requestMethod)) {
            Map<String, String> paramMap = ServletUtils.getParamMap(request);
            if (!paramMap.isEmpty()) {
                params.append(StringUtils_ApacheLang3.toJsonString(paramMap));
            }
        } 
        // Process POST/PUT request parameters
        else if ("POST".equalsIgnoreCase(requestMethod) || "PUT".equalsIgnoreCase(requestMethod)) {
            String contentType = request.getContentType();
            if (contentType != null) {
                if (contentType.contains("application/json")) {
                    // JSON format request body
                    try {
                        String bodyStr = ServletUtils.getBodyString(request);
                        if (StringUtils_ApacheLang3.isNotEmpty(bodyStr)) {
                            params.append(bodyStr);
                        }
                    } catch (Exception e) {
                        log.error("Failed to get request body", e);
                    }
                } else if (contentType.contains("application/x-www-form-urlencoded")) {
                    // Form data
                    Map<String, String> paramMap = ServletUtils.getParamMap(request);
                    if (!paramMap.isEmpty()) {
                        params.append(StringUtils_ApacheLang3.toJsonString(paramMap));
                    }
                } else if (contentType.contains("multipart/form-data")) {
                    // File upload form
                    params.append("multipart file upload");
                }
            }
        }
        
        return params.toString();
    }
} 