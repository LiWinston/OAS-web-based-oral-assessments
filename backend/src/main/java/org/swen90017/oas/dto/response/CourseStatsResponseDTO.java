package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * Course Statistics Response DTO
 * Used for returning course statistics for dashboard
 */
@Schema(description = "Course statistics response for dashboard")
@Data
public class CourseStatsResponseDTO {

    /**
     * Success flag
     */
    @Schema(description = "Success flag", example = "true")
    private Boolean success;

    /**
     * Statistics data
     */
    @Schema(description = "Statistics data")
    private StatsData data;

    /**
     * Inner class for statistics data
     */
    @Schema(description = "Statistics data container")
    @Data
    public static class StatsData {

        /**
         * Total number of courses
         */
        @Schema(description = "Total number of courses", example = "15")
        private Integer totalCourses;

        /**
         * Number of active courses
         */
        @Schema(description = "Number of active courses", example = "12")
        private Integer activeCourses;

        /**
         * Total number of students
         */
        @Schema(description = "Total number of students", example = "300")
        private Integer totalStudents;

        /**
         * Total number of assignments
         */
        @Schema(description = "Total number of assignments", example = "45")
        private Integer totalAssignments;

        /**
         * Current semester information
         */
        @Schema(description = "Current semester information", example = "2024 Semester 1")
        private String currentSemester;

        /**
         * Constructor
         */
        public StatsData(Integer totalCourses, Integer activeCourses, Integer totalStudents, 
                        Integer totalAssignments, String currentSemester) {
            this.totalCourses = totalCourses;
            this.activeCourses = activeCourses;
            this.totalStudents = totalStudents;
            this.totalAssignments = totalAssignments;
            this.currentSemester = currentSemester;
        }
    }

    /**
     * Constructor
     */
    public CourseStatsResponseDTO(Integer totalCourses, Integer activeCourses, Integer totalStudents, 
                                 Integer totalAssignments, String currentSemester) {
        this.success = true;
        this.data = new StatsData(totalCourses, activeCourses, totalStudents, totalAssignments, currentSemester);
    }
}
