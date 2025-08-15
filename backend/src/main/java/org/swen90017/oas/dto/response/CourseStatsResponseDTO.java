package org.swen90017.oas.dto.response;

import lombok.Data;

/**
 * Course Statistics Response DTO
 * Used for returning course statistics for dashboard
 */
@Data
public class CourseStatsResponseDTO {

    /**
     * Success flag
     */
    private Boolean success;

    /**
     * Statistics data
     */
    private StatsData data;

    /**
     * Inner class for statistics data
     */
    @Data
    public static class StatsData {

        /**
         * Total number of courses
         */
        private Integer totalCourses;

        /**
         * Number of active courses
         */
        private Integer activeCourses;

        /**
         * Total number of students
         */
        private Integer totalStudents;

        /**
         * Total number of assignments
         */
        private Integer totalAssignments;

        /**
         * Current semester information
         */
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
