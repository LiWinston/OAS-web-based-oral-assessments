package org.swen90017.oas.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
public class SysStudent{
    private Long userId;
    private String token;
    private String studentNumber;
    private String sisUserId;
}
