package org.swen90017.oas.query;

import lombok.Data;
import org.swen90017.oas.annotation.QueryField;
import org.swen90017.oas.enums.QueryType;
@Data
public class StudentQuery {
    @QueryField(type = QueryType.EQUAL, column = "student_number")
    private String studentId;

    @QueryField(type = QueryType.EQUAL)
    private Boolean activated;

    @QueryField(type = QueryType.EQUAL)
    private String token;

    // getters/setters
}
