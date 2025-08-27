package org.swen90017.oas.service;

import org.swen90017.oas.dto.request.RegisterRequestDTO;
import org.swen90017.oas.dto.response.OnboardingVerifyResponse;
import org.swen90017.oas.entity.SysUser;

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
    SysUser register(RegisterRequestDTO requestDTO);

}


