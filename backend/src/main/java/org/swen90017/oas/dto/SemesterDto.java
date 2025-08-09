package org.swen90017.oas.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Semester DTO
 * User Story 4.1: Set up academic periods (year, semester, subject)
 */
@Data
public class SemesterDto {

    /**
     * Semester ID (for update operations)
     */
    private Long semesterId;

    /**
     * Academic year ID
     */
    @NotNull(message = "Academic year ID cannot be null")
    private Long academicYearId;

    /**
     * Semester name (e.g., "Semester 1", "Semester 2", "Summer")
     */
    @NotBlank(message = "Semester name cannot be blank")
    private String semesterName;

    /**
     * Semester code (e.g., "S1", "S2", "SU")
     */
    @NotBlank(message = "Semester code cannot be blank")
    private String semesterCode;

    /**
     * Semester start date
     */
    @NotNull(message = "Start date cannot be null")
    private LocalDate startDate;

    /**
     * Semester end date
     */
    @NotNull(message = "End date cannot be null")
    private LocalDate endDate;

    /**
     * Is active
     */
    private Boolean isActive = true;
}
