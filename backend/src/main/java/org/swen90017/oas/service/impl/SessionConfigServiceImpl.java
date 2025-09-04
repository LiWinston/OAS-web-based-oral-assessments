package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.utils.SecurityUtils;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.CommonError;
import org.swen90017.oas.dto.request.SessionConfigRequestDTO;
import org.swen90017.oas.entity.LoginUser;
import org.swen90017.oas.dto.response.SessionConfigResponseDTO;
import org.swen90017.oas.entity.AssignmentSessionConfig;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AssignmentSessionConfigMapper;
import org.swen90017.oas.service.SessionConfigService;

/**
 * Session Configuration Service Implementation
 * Implements operations for managing assignment session configurations
 */
@Service
@RequiredArgsConstructor
public class SessionConfigServiceImpl extends ServiceImpl<AssignmentSessionConfigMapper, AssignmentSessionConfig> implements SessionConfigService {

    private final AssignmentSessionConfigMapper sessionConfigMapper;

    @Override
    public SessionConfigResponseDTO getSessionConfig(Long assignmentId) {
        AssignmentSessionConfig config = sessionConfigMapper.selectById(assignmentId);
        if (config == null) {
            throw new BusinessException(BusinessError.SESSION_CONFIG_NOT_FOUND);
        }
        return convertToResponseDTO(config);
    }

    @Override
    @Transactional
    public SessionConfigResponseDTO upsertSessionConfig(Long assignmentId, SessionConfigRequestDTO request) {
        // Try to get existing configuration
        AssignmentSessionConfig existingConfig = sessionConfigMapper.selectById(assignmentId);
        
        AssignmentSessionConfig config = new AssignmentSessionConfig();
        config.setAssignmentId(assignmentId);
        
        if (existingConfig != null) {
            // Update existing config: only update fields that are provided (not null)
            config.setSessionLengthMin(request.getSessionLength() != null ? 
                request.getSessionLength() : existingConfig.getSessionLengthMin());
            config.setGapTimeMin(request.getGapTime() != null ? 
                request.getGapTime() : existingConfig.getGapTimeMin());
            config.setExaminersPerSession(request.getExaminersPerSession() != null ? 
                request.getExaminersPerSession() : existingConfig.getExaminersPerSession());
            config.setDefaultMaxSessionsPerExaminer(request.getDefaultMaxSessionsPerExaminer() != null ? 
                request.getDefaultMaxSessionsPerExaminer() : existingConfig.getDefaultMaxSessionsPerExaminer());
        } else {
            // Create new config: use provided values or sensible defaults
            config.setSessionLengthMin(request.getSessionLength() != null ? request.getSessionLength() : 30);
            config.setGapTimeMin(request.getGapTime() != null ? request.getGapTime() : 5);
            config.setExaminersPerSession(request.getExaminersPerSession() != null ? request.getExaminersPerSession() : 2);
            config.setDefaultMaxSessionsPerExaminer(request.getDefaultMaxSessionsPerExaminer() != null ? request.getDefaultMaxSessionsPerExaminer() : 0);
        }

        // Guard: examiners per session must be >= 1
        if (config.getExaminersPerSession() == null || config.getExaminersPerSession() < 1) {
            throw new BusinessException(BusinessError.INVALID_SESSION_CONFIG_EXAMINERS);
        }

        // Time must > 0
        if (config.getGapTimeMin() == null || config.getGapTimeMin() <= 0) {
            throw new BusinessException(CommonError.BAD_REQUEST);
        }

        if (config.getSessionLengthMin() == null || config.getSessionLengthMin() <= 0) {
            throw new BusinessException(CommonError.BAD_REQUEST);
        }

        // Set updater information
        LoginUser currentUser = SecurityUtils.getLoginUser();
        config.setUpdatedBy(currentUser != null ? currentUser.getUserId() : null);

        // Use the upsert method from mapper
        sessionConfigMapper.upsert(config);
        
        // Return the updated configuration
        return getSessionConfig(assignmentId);
    }

    @Override
    @Transactional
    public void deleteSessionConfig(Long assignmentId) {
        sessionConfigMapper.deleteById(assignmentId);
    }

    /**
     * Convert entity to response DTO
     */
    private SessionConfigResponseDTO convertToResponseDTO(AssignmentSessionConfig config) {
        SessionConfigResponseDTO dto = new SessionConfigResponseDTO();
        dto.setAssignmentId(config.getAssignmentId());
        dto.setSessionLength(config.getSessionLengthMin());
        dto.setGapTime(config.getGapTimeMin());
        dto.setExaminersPerSession(config.getExaminersPerSession());
        dto.setDefaultMaxSessionsPerExaminer(config.getDefaultMaxSessionsPerExaminer());
        dto.setIsConfigured(config.getIsConfigured());
        dto.setLastModified(config.getLastModified());
        dto.setUpdatedBy(config.getUpdatedBy());
        return dto;
    }
}
