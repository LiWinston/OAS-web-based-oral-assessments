package org.swen90017.oas.dto.profile;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class ProfileUserDto {
    Long userId;
    String email;
    String name;
    String role;
    String department;
    String phone;
    String timezone;
    String language;
    Integer completeness;
    LocalDateTime lastUpdatedAt;
}
