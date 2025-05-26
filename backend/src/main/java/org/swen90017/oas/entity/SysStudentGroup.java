package org.swen90017.oas.entity;

import lombok.Data;

@Data
public class SysStudentGroup {
    private Long userId;
    private Long groupId;

    public SysStudentGroup(Long userId, Long groupId) {
        this.userId = userId;
        this.groupId = groupId;
    }
}
