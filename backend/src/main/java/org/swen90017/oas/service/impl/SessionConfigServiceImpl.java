package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.SessionConfigRequestDTO;
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
    public SessionConfigResponseDTO upsertSessionConfig(Long assignmentId, SessionConfigRequestDTO request, Long updatedBy) {
        AssignmentSessionConfig config = new AssignmentSessionConfig();
        config.setAssignmentId(assignmentId);
        config.setSessionLengthMin(request.getSessionLength());
        config.setGapTimeMin(request.getGapTime());
        config.setExaminersPerSession(request.getExaminersPerSession());
        config.setDefaultMaxSessionsPerExaminer(request.getDefaultMaxSessionsPerExaminer());
        config.setUpdatedBy(updatedBy);

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
