package org.swen90017.oas.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.PostConstruct;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@RestController
public class DeploymentTimeController {

    private Instant deploymentTime;

    @PostConstruct
    public void init() {
        this.deploymentTime = Instant.now();
    }

    @GetMapping("/deploy-time")
    public String getDeploymentTime() {
        String formatted = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.of("Australia/Sydney"))
                .format(deploymentTime);
        return "Last deployment is at: " + formatted;
    }
}
