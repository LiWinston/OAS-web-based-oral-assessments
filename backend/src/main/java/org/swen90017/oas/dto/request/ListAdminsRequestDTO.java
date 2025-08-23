package org.swen90017.oas.dto.request;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ListAdminsRequestDTO extends PageRequestDTO {
    private String status; // INVITED, REGISTERED, ACTIVE, INACTIVE, EXPIRED
    private String department;
    private String name;   // fuzzy match on user_name
    private String email;  // fuzzy match on email
}


