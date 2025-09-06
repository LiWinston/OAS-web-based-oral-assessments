package org.swen90017.oas.dto.request;

import lombok.Data;

import javax.validation.constraints.NotEmpty;
import java.util.List;

@Data
public class AssignSessionExaminersRequestDTO {
    @NotEmpty
    private List<Long> examinerIds;
}


