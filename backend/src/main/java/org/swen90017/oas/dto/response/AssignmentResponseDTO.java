package org.swen90017.oas.dto.response;

import lombok.Data;
import org.swen90017.oas.dto.RubricsInfoDto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Assignment Response DTO
 * Used for returning assignment information
 */
@Data
public class AssignmentResponseDTO {

    /**
     * Assignment ID
     */
    private Long id;

    /**
     * Subject ID
     */
    private Long subjectId;

    /**
     * Assignment name
     */
    private String name;

    /**
     * Assignment description
     */
    private String description;

    /**
     * Assignment type
     */
    private String type;

    /**
     * Start date
     */
    private LocalDateTime startDate;

    /**
     * End date
     */
    private LocalDateTime endDate;

    /**
     * Assignment weight
     */
    private Double weight;

    /**
     * Assignment progress
     */
    private Double progress;

    /**
     * Assignment status
     */
    private String status;

    /**
     * Rubric meta information (JSON string)
     */
    private String rubricMetaInfo;

    /**
     * Rubrics information list
     */
    private List<RubricsInfoDto> rubricsInfo;

    /**
     * Creator user ID
     */
    private Long creator;

    /**
     * Updater user ID
     */
    private Long updater;

    /**
     * Create time
     */
    private LocalDateTime createTime;

    /**
     * Update time
     */
    private LocalDateTime updateTime;
}
