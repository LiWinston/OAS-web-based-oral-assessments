package org.swen90017.oas.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum AssignMode {
    INDIVIDUAL("INDIVIDUAL"),
    GROUP("GROUP");

    @EnumValue
    @JsonValue
    private final String code;
}


