package org.swen90017.oas.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.swen90017.oas.dto.request.SessionConfigRequestDTO;
import org.swen90017.oas.dto.response.SessionConfigResponseDTO;
import org.swen90017.oas.entity.AssignmentSessionConfig;

/**
 * Session Configuration Service Interface
 * Defines operations for managing assignment session configurations
 */
public interface SessionConfigService extends IService<AssignmentSessionConfig> {

    /**
     * Get session configuration by assignment ID
     *
     * @param assignmentId Assignment ID
     * @return Session configuration response DTO
     */
    SessionConfigResponseDTO getSessionConfig(Long assignmentId);

    /**
     * Update or create session configuration for an assignment
     *
     * @param assignmentId Assignment ID
     * @param request Session configuration request DTO
     * @return Session configuration response DTO
     */
    SessionConfigResponseDTO upsertSessionConfig(Long assignmentId, SessionConfigRequestDTO request);

    /**
     * Delete session configuration by assignment ID
     *
     * @param assignmentId Assignment ID
     */
    void deleteSessionConfig(Long assignmentId);
}
