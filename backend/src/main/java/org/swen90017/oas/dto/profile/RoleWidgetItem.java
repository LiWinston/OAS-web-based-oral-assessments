package org.swen90017.oas.dto.profile;

import lombok.Builder;
import lombok.Value;

import java.util.Map;

@Value
@Builder
public class RoleWidgetItem {
    String key;
    String title;
    String description;
    Map<String, Object> payload;
}
