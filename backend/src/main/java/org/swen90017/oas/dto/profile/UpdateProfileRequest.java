package org.swen90017.oas.dto.profile;

import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Size(max = 120)
    private String name;

    @Size(max = 120)
    private String department;

    @Pattern(regexp = "^[+0-9()\\s-]{0,32}$", message = "Invalid phone number")
    private String phone;

    @Size(max = 60)
    private String timezone;

    @Size(max = 10)
    private String language;
}
