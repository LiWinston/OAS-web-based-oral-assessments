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
import org.swen90017.oas.utils.StringUtils;

/**
 * Operation log recording processing aspect
 *
 * @author Yongchun Li
 */
@Aspect
@Component
public class LogAspect {
    private static final Logger log = LoggerFactory.getLogger(LogAspect.class);

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
            String module = StringUtils.isEmpty(logAnnotation.module()) ? "" : logAnnotation.module();
            
            // Get operation type
            String operType = StringUtils.isEmpty(logAnnotation.operType()) ? "" : logAnnotation.operType();
            
            // Record method parameters
            String requestParams = "";
            if (logAnnotation.isSaveRequestData()) {
                requestParams = getRequestParams(joinPoint, request);
            }
            
            // Output log record
            StringBuilder logBuilder = new StringBuilder();
            logBuilder.append("\n========== Request Log Begin ==========\n");
            logBuilder.append("Module: ").append(module).append("\n");
            logBuilder.append("Operation: ").append(operType).append("\n");
            logBuilder.append("IP: ").append(ipAddr).append("\n");
            logBuilder.append("URL: ").append(requestUrl).append("\n");
            logBuilder.append("HTTP Method: ").append(requestMethod).append("\n");
            logBuilder.append("User-Agent: ").append(userAgent).append("\n");
            logBuilder.append("Class Method: ").append(joinPoint.getSignature().getDeclaringTypeName())
                    .append(".").append(joinPoint.getSignature().getName()).append("\n");
            
            if (StringUtils.isNotEmpty(requestParams)) {
                logBuilder.append("Request Parameters: ").append(requestParams).append("\n");
            }
            
            logBuilder.append("Execution Time: ").append(time).append(" ms\n");
            logBuilder.append("========== Request Log End ==========");
            
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
            String module = StringUtils.isEmpty(logAnnotation.module()) ? "" : logAnnotation.module();
            
            // Get operation type
            String operType = StringUtils.isEmpty(logAnnotation.operType()) ? "" : logAnnotation.operType();
            
            // Record method parameters
            String requestParams = "";
            if (logAnnotation.isSaveRequestData()) {
                requestParams = getRequestParams(joinPoint, request);
            }
            
            // Build exception log
            StringBuilder logBuilder = new StringBuilder();
            logBuilder.append("\n========== Exception Log Begin ==========\n");
            logBuilder.append("Module: ").append(module).append("\n");
            logBuilder.append("Operation: ").append(operType).append("\n");
            logBuilder.append("IP: ").append(ipAddr).append("\n");
            logBuilder.append("URL: ").append(requestUrl).append("\n");
            logBuilder.append("HTTP Method: ").append(requestMethod).append("\n");
            logBuilder.append("Class Method: ").append(joinPoint.getSignature().getDeclaringTypeName())
                    .append(".").append(joinPoint.getSignature().getName()).append("\n");
            
            if (StringUtils.isNotEmpty(requestParams)) {
                logBuilder.append("Request Parameters: ").append(requestParams).append("\n");
            }
            
            logBuilder.append("Exception: ").append(e.getMessage()).append("\n");
            logBuilder.append("========== Exception Log End ==========");
            
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
                params.append(StringUtils.toJsonString(paramMap));
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
                        if (StringUtils.isNotEmpty(bodyStr)) {
                            params.append(bodyStr);
                        }
                    } catch (Exception e) {
                        log.error("Failed to get request body", e);
                    }
                } else if (contentType.contains("application/x-www-form-urlencoded")) {
                    // Form data
                    Map<String, String> paramMap = ServletUtils.getParamMap(request);
                    if (!paramMap.isEmpty()) {
                        params.append(StringUtils.toJsonString(paramMap));
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