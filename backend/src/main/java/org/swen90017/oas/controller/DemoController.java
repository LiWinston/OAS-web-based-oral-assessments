package org.swen90017.oas.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.enums.OperatorType;
import org.swen90017.oas.utils.IpUtils;
import org.swen90017.oas.utils.ServletUtils;

/**
 * Demo Controller - Demonstrates the usage of @Log annotation
 */
@RestController
@RequestMapping("/api/demo")
public class DemoController {
    
    /**
     * GET request demo
     *
     * @param name Name parameter
     * @return Response result
     */
    @GetMapping("/hello")
    @Log(module = "Demo Module", businessType = BusinessType.QUERY, operatorType = OperatorType.OTHER)
    public Map<String, Object> hello(@RequestParam(required = false) String name) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Hello, " + (name != null ? name : "World"));
        result.put("timestamp", System.currentTimeMillis());
        
        // Get client IP
        String clientIp = IpUtils.getIpAddr();
        result.put("clientIp", clientIp);
        
        return result;
    }
    
    /**
     * POST request demo
     *
     * @param data Request data
     * @return Response result
     */
    @PostMapping("/submit")
    @Log(module = "Demo Module", businessType = BusinessType.INSERT, operatorType = OperatorType.OTHER)
    public Map<String, Object> submit(@RequestBody Map<String, Object> data) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Data submitted successfully");
        result.put("timestamp", System.currentTimeMillis());
        result.put("receivedData", data);
        
        return result;
    }
    
    /**
     * Exception handling demo
     *
     * @param id Record ID
     * @return Response result
     */
    @GetMapping("/error-demo")
    @Log(module = "Demo Module", businessType = BusinessType.DELETE, operatorType = OperatorType.OTHER)
    public Map<String, Object> errorDemo(@RequestParam Integer id) {
        Map<String, Object> result = new HashMap<>();
        
        // Deliberately throw an exception for testing
        if (id <= 0) {
            throw new IllegalArgumentException("ID must be greater than 0");
        }
        
        result.put("success", true);
        result.put("message", "Operation completed successfully");
        result.put("id", id);
        
        return result;
    }
} 