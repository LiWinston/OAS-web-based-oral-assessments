package org.swen90017.oas.dto.request;

import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@Data
public class UpdateSessionsExaminersRequestDTO {
    @NotEmpty
    private List<Long> sessionIds;
    @NotEmpty
    private List<Long> examinerIds;
    @NotNull
    private String action; // add | remove | set
}


