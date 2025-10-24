package org.swen90017.oas.dto.response;

import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Individual Grade Export DTO
 * Format: Student	ID	SIS User ID	SIS Login ID	Section	Student Id	Sample1(Sample ID1) -example: rubric1 (123456)	Sample2(Sample ID2) -example: rubric 2(786543)
 */
@Data
public class IndividualGradeExportDTO {
    
    private String student;
    private String id;
    private String sisUserId;
    private String sisLoginId;
    private String section;
    private String studentId;
    
    // Dynamic rubric scores - will be added programmatically
    // Map key: column name (e.g., "Sample1(Sample ID1)")
    // Map value: score value
    private Map<String, String> rubricScores = new LinkedHashMap<>();
}

