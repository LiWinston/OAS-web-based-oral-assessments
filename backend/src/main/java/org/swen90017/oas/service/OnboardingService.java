package org.swen90017.oas.service;

import org.swen90017.oas.dto.response.OnboardingVerifyResponse;

/**
 * Onboarding verification service
 */
public interface OnboardingService {
    /**
     * Verify onboarding token and return a role-specific response payload.
     *
     * @param token invitation/activation token
     * @return unified response matching the onboarding contract
     */
    OnboardingVerifyResponse verify(String token);
}


