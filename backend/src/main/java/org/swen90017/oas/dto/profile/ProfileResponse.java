package org.swen90017.oas.dto.profile;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;

@Value
@Builder
public class ProfileResponse {
    ProfileUserDto user;
    NotificationPreferencesDto preferences;
    List<RoleWidgetItem> widgets;
    LocalDateTime generatedAt;
}
