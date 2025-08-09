package org.swen90017.oas.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Basic test to verify Epic 4.1 implementation compiles
 * User Story 4.1: Set up academic periods (year, semester, subject)
 */
@SpringBootTest
@ActiveProfiles("test")
public class AcademicStructureTest {

    @Test
    public void contextLoads() {
        // This test ensures the Spring context loads with our new entities and services
        // If this passes, our basic Epic 4.1 implementation is structurally sound
    }
}
