package org.swen90017.oas.dto.profile;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class NotificationPreferencesDto {
    Boolean email;
    Boolean desktop;
    Boolean bookingUpdates;
    Boolean examinerUpdates;
    Boolean assignmentUpdates;
    Boolean resultUpdates;
    Boolean groupUpdates;
    Boolean systemAlerts;
}
