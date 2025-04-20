package org.swen90017.oas.aspect;

import java.lang.reflect.Method;
import java.util.Collection;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.NamedThreadLocal;
import org.springframework.stereotype.Component;
import org.springframework.validation.BindingResult;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.entity.SysOperLog;
import org.swen90017.oas.enums.BusinessStatus;
import org.swen90017.oas.utils.AsyncFactory;
import org.swen90017.oas.utils.AsyncManager;
import org.swen90017.oas.utils.IpUtils;
import org.swen90017.oas.utils.SecurityUtils;
import org.swen90017.oas.utils.ServletUtils;
import org.swen90017.oas.utils.StringUtils;

import com.alibaba.fastjson2.JSON;

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
    
    /** Exclude sensitive property fields */
    public static final String[] EXCLUDE_PROPERTIES = { "password", "oldPassword", "newPassword", "confirmPassword" };
    
    /** Calculate operation time consumption */
    private static final ThreadLocal<Long> TIME_THREADLOCAL = new NamedThreadLocal<Long>("Cost Time");
    
    /**
     * Configure pointcut
     */
    @Pointcut("@annotation(org.swen90017.oas.annotation.Log)")
    public void logPointCut() {
    }

    /**
     * Process request before execution
     */
    @Before(value = "@annotation(controllerLog)")
    public void doBefore(JoinPoint joinPoint, Log controllerLog) {
        TIME_THREADLOCAL.set(System.currentTimeMillis());
    }
    
    /**
     * Execute after processing the request with normal return
     *
     * @param joinPoint    JoinPoint
     * @param controllerLog Log annotation
     * @param jsonResult  Return result
     */
    @AfterReturning(pointcut = "@annotation(controllerLog)", returning = "jsonResult")
    public void doAfterReturning(JoinPoint joinPoint, Log controllerLog, Object jsonResult) {
        handleLog(joinPoint, controllerLog, null, jsonResult);
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
        
        // Record log - this only handles console output, database persistence is handled by doAfterReturning
        recordRequestLog(joinPoint, time);
        
        return result;
    }

    /**
     * Intercept exception operation
     *
     * @param joinPoint JoinPoint
     * @param e         Exception
     */
    @AfterThrowing(value = "@annotation(controllerLog)", throwing = "e")
    public void doAfterThrowing(JoinPoint joinPoint, Log controllerLog, Exception e) {
        handleLog(joinPoint, controllerLog, e, null);
    }
    
    /**
     * Handle log recording
     * 
     * @param joinPoint  Join point
     * @param controllerLog Log annotation
     * @param e          Exception
     * @param jsonResult Return result
     */
    protected void handleLog(final JoinPoint joinPoint, Log controllerLog, final Exception e, Object jsonResult) {
        try {
            // Get current user
            String username = SecurityUtils.getUsername();
            String userRole = SecurityUtils.getUserRole();

            // Database log
            SysOperLog operLog = new SysOperLog();
            operLog.setStatus(e == null ? BusinessStatus.SUCCESS.ordinal() : BusinessStatus.FAIL.ordinal());
            
            // Request URL
            String ip = IpUtils.getIpAddr();
            operLog.setOperIp(ip);
            operLog.setOperUrl(StringUtils.substring(ServletUtils.getRequest().getRequestURI(), 0, 255));
            
            // Set operator info
            operLog.setOperName(username);
            operLog.setOperRole(userRole);

            if (e != null) {
                operLog.setErrorMsg(StringUtils.substring(e.getMessage(), 0, 2000));
            }
            
            // Set method name
            String className = joinPoint.getTarget().getClass().getName();
            String methodName = joinPoint.getSignature().getName();
            operLog.setMethod(className + "." + methodName + "()");
            
            // Set request method
            operLog.setRequestMethod(ServletUtils.getRequest().getMethod());
            
            // Handle annotation parameters
            getControllerMethodDescription(joinPoint, controllerLog, operLog, jsonResult);
            
            // Set time consumption
            operLog.setCostTime(TIME_THREADLOCAL.get() != null ? System.currentTimeMillis() - TIME_THREADLOCAL.get() : 0L);
            
            // Save to database asynchronously
            AsyncManager.me().execute(AsyncFactory.recordOper(operLog));
            
        } catch (Exception exp) {
            log.error("Failed to record log", exp);
        } finally {
            TIME_THREADLOCAL.remove();
        }
    }
    
    /**
     * Get controller method description from annotation
     * 
     * @param joinPoint JoinPoint
     * @param log       Log annotation
     * @param operLog   Operation log
     * @param jsonResult Return result
     * @throws Exception Exception
     */
    public void getControllerMethodDescription(JoinPoint joinPoint, Log log, SysOperLog operLog, Object jsonResult) throws Exception {
        // Set business type
        operLog.setBusinessType(log.businessType().ordinal());
        
        // Set title
        operLog.setTitle(log.module());
        
        // Set operator type
        operLog.setOperatorType(log.operatorType().ordinal());
        
        // Whether to save request data
        if (log.isSaveRequestData()) {
            // Get parameter information
            setRequestValue(joinPoint, operLog, log.excludeParamNames());
        }
        
        // Whether to save response data
        if (log.isSaveResponseData() && jsonResult != null) {
            operLog.setJsonResult(StringUtils.substring(JSON.toJSONString(jsonResult), 0, 2000));
        }
    }
    
    /**
     * Get request parameters
     * 
     * @param joinPoint JoinPoint
     * @param operLog   Operation log
     * @param excludeParamNames Exclude parameter names
     * @throws Exception Exception
     */
    private void setRequestValue(JoinPoint joinPoint, SysOperLog operLog, String[] excludeParamNames) throws Exception {
        HttpServletRequest request = ServletUtils.getRequest();
        if (request == null) {
            return;
        }
        
        String requestMethod = operLog.getRequestMethod();
        
        // Get URL parameter map
        Map<String, String> paramsMap = ServletUtils.getParamMap(request);
        
        if (paramsMap.isEmpty() && 
            ("POST".equals(requestMethod) || "PUT".equals(requestMethod) || "DELETE".equals(requestMethod))) {
            String params = argsArrayToString(joinPoint.getArgs(), excludeParamNames);
            operLog.setOperParam(StringUtils.substring(params, 0, 2000));
        } else {
            operLog.setOperParam(StringUtils.substring(JSON.toJSONString(paramsMap), 0, 2000));
        }
    }
    
    /**
     * Parameter array to string
     */
    private String argsArrayToString(Object[] paramsArray, String[] excludeParamNames) {
        StringBuilder params = new StringBuilder();
        if (paramsArray != null) {
            for (Object o : paramsArray) {
                if (o != null && !isFilterObject(o)) {
                    try {
                        params.append(JSON.toJSONString(o)).append(" ");
                    } catch (Exception e) {
                        // Ignore
                    }
                }
            }
        }
        return params.toString().trim();
    }
    
    /**
     * Determine if it is a filtered object
     * 
     * @param o Object
     * @return true if should be filtered
     */
    @SuppressWarnings("rawtypes")
    public boolean isFilterObject(final Object o) {
        Class<?> clazz = o.getClass();
        
        // Filter MultipartFile
        if (clazz.isArray()) {
            return clazz.getComponentType().isAssignableFrom(MultipartFile.class);
        } else if (Collection.class.isAssignableFrom(clazz)) {
            Collection collection = (Collection) o;
            for (Object value : collection) {
                return value instanceof MultipartFile;
            }
        } else if (Map.class.isAssignableFrom(clazz)) {
            Map map = (Map) o;
            for (Object value : map.entrySet()) {
                Map.Entry entry = (Map.Entry) value;
                return entry.getValue() instanceof MultipartFile;
            }
        }
        
        // Filter BindingResult
        return o instanceof MultipartFile || o instanceof HttpServletRequest || o instanceof HttpServletResponse
                || o instanceof BindingResult;
    }

    /**
     * Record request log (console output)
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
            
            // Get current logged-in user information
            String username = SecurityUtils.getUsername();
            
            // Record request information
            String requestMethod = request.getMethod();
            String requestUrl = ServletUtils.getFullRequestUrl(request);
            String ipAddr = IpUtils.getIpAddr();
            String userAgent = request.getHeader("User-Agent");
            
            // Get module name
            String module = StringUtils.isEmpty(logAnnotation.module()) ? "" : logAnnotation.module();
            
            // Get operation type
            String businessType = logAnnotation.businessType().toString();
            
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
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Operation:").append(ANSI_RESET).append("  ").append(businessType).append("\n");
            
            if (StringUtils.isNotEmpty(username)) {
                logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("User:").append(ANSI_RESET).append("       ").append(username).append("\n");
            }
            
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("IP:").append(ANSI_RESET).append("         ").append(ipAddr).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("URL:").append(ANSI_RESET).append("        ").append(requestUrl).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Method:").append(ANSI_RESET).append("     ").append(methodColor).append(requestMethod).append(ANSI_RESET).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("User-Agent:").append(ANSI_RESET).append(" ").append(userAgent).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Class:").append(ANSI_RESET).append("      ").append(joinPoint.getSignature().getDeclaringTypeName())
                    .append(".").append(joinPoint.getSignature().getName()).append("\n");
            
            if (StringUtils.isNotEmpty(requestParams)) {
                logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Parameters:").append(ANSI_RESET).append(" ").append(requestParams).append("\n");
            }
            
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Exec Time:").append(ANSI_RESET).append("  ").append(timeColor).append(time).append(" ms").append(ANSI_RESET).append("\n");
            logBuilder.append(bottomSeparator);
            
            log.info(logBuilder.toString());
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
            
            // Get current logged-in user information
            String username = SecurityUtils.getUsername();
            
            // Record request information
            String requestMethod = request.getMethod();
            String requestUrl = ServletUtils.getFullRequestUrl(request);
            String ipAddr = IpUtils.getIpAddr();
            
            // Get module name
            String module = StringUtils.isEmpty(logAnnotation.module()) ? "" : logAnnotation.module();
            
            // Get operation type
            String businessType = logAnnotation.businessType().toString();
            
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
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Operation:").append(ANSI_RESET).append("  ").append(businessType).append("\n");
            
            if (StringUtils.isNotEmpty(username)) {
                logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("User:").append(ANSI_RESET).append("       ").append(username).append("\n");
            }
            
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("IP:").append(ANSI_RESET).append("         ").append(ipAddr).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("URL:").append(ANSI_RESET).append("        ").append(requestUrl).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Method:").append(ANSI_RESET).append("     ").append(requestMethod).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Class:").append(ANSI_RESET).append("      ").append(joinPoint.getSignature().getDeclaringTypeName())
                    .append(".").append(joinPoint.getSignature().getName()).append("\n");
            
            if (StringUtils.isNotEmpty(requestParams)) {
                logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Parameters:").append(ANSI_RESET).append(" ").append(requestParams).append("\n");
            }
            
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Exception:").append(ANSI_RESET).append("  ").append(ANSI_RED).append(e.getMessage()).append(ANSI_RESET).append("\n");
            logBuilder.append(bottomSeparator);
            
            log.error(logBuilder.toString(), e);
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