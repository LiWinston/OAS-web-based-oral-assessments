package org.swen90017.oas.query;

import lombok.Data;
import org.swen90017.oas.annotation.QueryField;
import org.swen90017.oas.enums.QueryType;

// import java.util.Collection;

@Data
public class AdminListQuery {
    // Role constraint is handled in service by computing userIds and applying IN filter (not a table field)

    // Primary status mapped to DB values "0"/"1"
    @QueryField(column = "status", type = QueryType.EQUAL)
    private String status;
    // Primary status mapped to DB values "0"/"1"
    @QueryField(column = "registration_status", type = QueryType.EQUAL)
    private String registrationStatus;
    // Name LIKE -> user_name
    @QueryField(column = "user_name", type = QueryType.LIKE)
    private String name;

    // Email LIKE -> email
    @QueryField(type = QueryType.LIKE)
    private String email;

    // Department: if department column is added to sys_user in future, enable below line
    // @QueryField(column = "department", type = QueryType.EQUAL)
    // private String department;

    // Created time range (if needed in future)
    // @QueryField(column = "create_time", type = QueryType.GREATER_THAN_OR_EQUAL_TO)
    // private Date createdFrom;
    // @QueryField(column = "create_time", type = QueryType.LESS_THAN_OR_EQUAL_TO)
    // private Date createdTo;

    // Removed ids. Service keeps role filtering logic
}


