package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.swen90017.oas.dto.RubricsInfoDto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Assignment Response DTO
 * Used for returning assignment information
 */
@Schema(description = "Assignment response data")
@Data
public class AssignmentResponseDTO {

    /**
     * Assignment ID
     */
    @Schema(description = "Assignment ID", example = "1")
    private Long id;

    /**
     * Subject ID
     */
    @Schema(description = "Subject ID", example = "1")
    private Long subjectId;

    /**
     * Subject code
     */
    @Schema(description = "Subject code", example = "SWEN90017")
    private String subjectCode;

    /**
     * Subject name
     */
    @Schema(description = "Subject name", example = "Software Engineering Project Management")
    private String subjectName;

    /**
     * Assignment name
     */
    @Schema(description = "Assignment name", example = "Oral Presentation")
    private String name;

    /**
     * Assignment description
     */
    @Schema(description = "Assignment description", example = "Individual oral presentation on project progress")
    private String description;

    /**
     * Assignment type
     */
    @Schema(description = "Assignment type", example = "individual", allowableValues = {"individual", "group", "mixed"})
    private String type;

    /**
     * Start date
     */
    @Schema(description = "Assignment start date", example = "2024-03-01T09:00:00")
    private LocalDateTime startDate;

    /**
     * End date
     */
    @Schema(description = "Assignment end date", example = "2024-03-15T23:59:59")
    private LocalDateTime endDate;

    /**
     * Assignment weight
     */
    @Schema(description = "Assignment weight (0.0 to 100.0)", example = "25.0")
    private Double weight;

    /**
     * Assignment progress
     */
    @Schema(description = "Assignment progress (0.0 to 100.0)", example = "50.0")
    private Double progress;

    /**
     * Assignment status
     */
    @Schema(description = "Assignment status", example = "IN_PROGRESS", allowableValues = {"PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"})
    private String status;

    /**
     * Rubric meta information (JSON string)
     */
    @Schema(description = "Rubric meta information (JSON)", example = "{\"name\":\"Oral Presentation Rubric\",\"description\":\"Evaluation criteria\",\"totalPoints\":100}")
    private String rubricMetaInfo;

    /**
     * Rubrics information list
     */
    @Schema(description = "List of rubric criteria")
    private List<RubricsInfoDto> rubricsInfo;

    /**
     * Creator user ID
     */
    @Schema(description = "Creator user ID", example = "1")
    private Long creator;

    /**
     * Updater user ID
     */
    @Schema(description = "Updater user ID", example = "1")
    private Long updater;

    /**
     * Create time
     */
    @Schema(description = "Create time", example = "2024-01-15T10:30:00")
    private LocalDateTime createTime;

    /**
     * Update time
     */
    @Schema(description = "Update time", example = "2024-01-20T14:45:00")
    private LocalDateTime updateTime;
}
