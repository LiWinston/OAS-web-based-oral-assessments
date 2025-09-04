package org.swen90017.oas.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ScheduleStatus {
    DRAFT("draft"),
    RELEASED("released"),
    ARCHIVED("archived");
    @EnumValue
    @JsonValue
    private final String code;
}
