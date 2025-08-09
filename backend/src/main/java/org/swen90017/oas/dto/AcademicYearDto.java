package org.swen90017.oas.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Academic Year DTO
 * User Story 4.1: Set up academic periods (year, semester, subject)
 */
@Data
public class AcademicYearDto {

    /**
     * Academic year ID (for update operations)
     */
    private Long yearId;

    /**
     * Academic year value (e.g., "2024", "2025")
     */
    @NotBlank(message = "Year value cannot be blank")
    private String yearValue;

    /**
     * Academic year start date
     */
    @NotNull(message = "Start date cannot be null")
    private LocalDate startDate;

    /**
     * Academic year end date
     */
    @NotNull(message = "End date cannot be null")
    private LocalDate endDate;

    /**
     * Is active
     */
    private Boolean isActive = true;
}
