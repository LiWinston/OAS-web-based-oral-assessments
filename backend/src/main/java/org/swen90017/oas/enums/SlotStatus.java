package org.swen90017.oas.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum SlotStatus {
    DRAFT("draft"),
    EMPTY("empty"),
    PARTIAL("partial"),
    FULL("full"),
    CLOSED("closed");

    @EnumValue
    @JsonValue
    private final String code;
}