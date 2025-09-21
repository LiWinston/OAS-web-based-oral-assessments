package org.swen90017.oas.service;

import org.swen90017.oas.dto.profile.ProfileResponse;
import org.swen90017.oas.dto.profile.UpdatePreferencesRequest;
import org.swen90017.oas.dto.profile.UpdateProfileRequest;

public interface ProfileService {
    ProfileResponse getCurrentProfile(Long userId);

    ProfileResponse updateProfile(Long userId, UpdateProfileRequest request);

    ProfileResponse updatePreferences(Long userId, UpdatePreferencesRequest request);

    void changePassword(Long userId, String currentPassword, String newPassword);
}
