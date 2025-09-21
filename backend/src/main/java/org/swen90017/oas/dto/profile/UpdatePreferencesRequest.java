package org.swen90017.oas.dto.profile;

import javax.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdatePreferencesRequest {
    private Boolean email;
    private Boolean desktop;
    private Boolean bookingUpdates;
    private Boolean examinerUpdates;
    private Boolean assignmentUpdates;
    private Boolean resultUpdates;
    private Boolean groupUpdates;
    private Boolean systemAlerts;

    @Size(max = 60)
    private String timezone;

    @Size(max = 10)
    private String language;
}
