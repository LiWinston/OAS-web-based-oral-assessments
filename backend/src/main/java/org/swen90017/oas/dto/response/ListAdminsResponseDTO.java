package org.swen90017.oas.dto.response;

import lombok.Data;
import java.util.List;
import org.swen90017.oas.entity.SysAdmin;

@Data
public class ListAdminsResponseDTO {
    private List<SysAdmin> admins;
    private PaginationDTO pagination;
}


