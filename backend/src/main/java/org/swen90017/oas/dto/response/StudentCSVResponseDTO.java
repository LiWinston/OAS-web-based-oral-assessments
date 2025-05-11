package org.swen90017.oas.dto.response;

import java.util.LinkedHashMap;
import java.util.Map;

public class StudentCSVResponseDTO {
    private String student;
    private String id;
    private String sisUserId;
    private String sisLoginId;
    private String section;
    private String studentId;

    //TODO: After the rubric part is completed,  need to modify the type here
    private Map<String, String> scores = new LinkedHashMap<>();

}
