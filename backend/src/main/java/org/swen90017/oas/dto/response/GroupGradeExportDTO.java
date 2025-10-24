package org.swen90017.oas.dto.response;

import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Group Grade Export DTO
 * Format: name	canvas_user_id	SIS ID	login_id	Section	group_name	canvas_group_id	Sample1(Sample ID1) -example: rubric 1 (123456)	Sample2(Sample ID2) -example: rubric 2(786543)
 */
@Data
public class GroupGradeExportDTO {
    
    private String name;
    private String canvasUserId;
    private String sisId;
    private String loginId;
    private String section;
    private String groupName;
    private String canvasGroupId;
    
    // Dynamic rubric scores - will be added programmatically
    // Map key: column name (e.g., "Sample1(Sample ID1)")
    // Map value: score value
    private Map<String, String> rubricScores = new LinkedHashMap<>();
}

