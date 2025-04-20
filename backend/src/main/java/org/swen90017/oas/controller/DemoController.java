package org.swen90017.oas.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.enums.OperationType;
import org.swen90017.oas.utils.IpUtils;
import org.swen90017.oas.utils.ServletUtils;

import java.util.HashMap;
import java.util.Map;

/**
 * Demo Controller - Show the usage of @Log annotation
 *
 * @author Yongchun Li
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
    @Log(module = "Demo Module", operType = "Query Operation")
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
    @Log(module = "Demo Module", operType = "Submit Operation")
    public Map<String, Object> submit(@RequestBody Map<String, Object> data) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Data submitted successfully");
        result.put("timestamp", System.currentTimeMillis());
        result.put("receivedData", data);
        
        // Get client information of the current request
        String clientInfo = ServletUtils.getClientInfo(ServletUtils.getRequest());
        result.put("clientInfo", clientInfo);
        
        return result;
    }
    
    /**
     * Enum type operation demo
     *
     * @param id Record ID
     * @return Response result
     */
    @GetMapping("/delete")
    @Log(module = "Demo Module", operType = "DELETE")
    public Map<String, Object> delete(@RequestParam Integer id) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Record " + id + " has been deleted");
        result.put("timestamp", System.currentTimeMillis());
        
        return result;
    }
} 