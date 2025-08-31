package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.swen90017.oas.dto.RubricMetaInfo;
import org.swen90017.oas.dto.RubricsInfoDto;
import org.swen90017.oas.dto.request.AssignmentRequestDTO;
import org.swen90017.oas.dto.response.AssignmentResponseDTO;
import org.swen90017.oas.dto.response.AssignmentStatusStatsResponseDTO;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.entity.Subject;
import org.swen90017.oas.enums.AssignmentType;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.SubjectMapper;
import org.swen90017.oas.service.AssignmentService;
import org.swen90017.oas.service.cache.AssignmentCacheSupport;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Assignment Service Implementation
 * Implements basic CRUD operations for Assignment management
 */
@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl extends ServiceImpl<AssignmentMapper, Assignment> implements AssignmentService {

    private final AssignmentMapper assignmentMapper;
    private final SubjectMapper subjectMapper;
    private final AssignmentCacheSupport cacheSupport;

    @Override
    public AssignmentResponseDTO getAssignmentById(Long id) {
        Assignment assignment = assignmentMapper.selectById(id);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        return convertToDTO(assignment);
    }

    @Override
    @Transactional
    public AssignmentResponseDTO createAssignment(AssignmentRequestDTO dto) {
        // Validate subject exists
        Subject subject = subjectMapper.selectById(dto.getSubjectId());
        if (subject == null) {
            throw new BusinessException(BusinessError.SUBJECT_NOT_FOUND);
        }

        // Validate assignment type
        if (!isValidAssignmentType(dto.getType())) {
            throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_TYPE);
        }

        // Validate dates
        if (dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_DATES);
        }

        // Validate weight
        if (dto.getWeight() < 0.0 || dto.getWeight() > 100.0) {
            throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_WEIGHT);
        }

        // Validate total weight for subject
        validateTotalWeightForSubject(dto.getSubjectId(), dto.getWeight(), null);

        // Validate rubrics info if provided
        if (dto.getRubricsInfo() != null) {
            validateRubricsInfo(dto.getRubricsInfo());
        }

        Assignment assignment = new Assignment();
        BeanUtils.copyProperties(dto, assignment);

        // Convert rubricsInfo list to JSON string for storage
        if (dto.getRubricsInfo() != null) {
            assignment.setRubricsInfo(convertRubricsInfoToJson(dto.getRubricsInfo()));
        }

        assignmentMapper.insert(assignment);
        
        // Clear cache directly - simpler approach
        try {
            cacheSupport.evictBySubjectId(dto.getSubjectId());
        } catch (Exception ignore) {
            // Log cache eviction failure but don't fail the operation
        }
        
        return convertToDTO(assignment);
    }

    @Override
    @Transactional
    public AssignmentResponseDTO updateAssignment(Long id, AssignmentRequestDTO dto) {
        Assignment existingAssignment = assignmentMapper.selectById(id);
        if (existingAssignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        Long oldSubjectId = existingAssignment.getSubjectId();

        // Validate subject exists
        Subject subject = subjectMapper.selectById(dto.getSubjectId());
        if (subject == null) {
            throw new BusinessException(BusinessError.SUBJECT_NOT_FOUND);
        }

        // Validate assignment type
        if (!isValidAssignmentType(dto.getType())) {
            throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_TYPE);
        }

        // Validate dates
        if (dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_DATES);
        }

        // Validate weight
        if (dto.getWeight() < 0.0 || dto.getWeight() > 100.0) {
            throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_WEIGHT);
        }

        // Validate total weight for subject (exclude current assignment)
        validateTotalWeightForSubject(dto.getSubjectId(), dto.getWeight(), id);

        BeanUtils.copyProperties(dto, existingAssignment, "id", "createTime", "creator");

        // Convert rubricsInfo list to JSON string for storage
        if (dto.getRubricsInfo() != null) {
            existingAssignment.setRubricsInfo(convertRubricsInfoToJson(dto.getRubricsInfo()));
        }

        if (dto.getRubricMetaInfo() != null) {
            existingAssignment.setRubricMetaInfo(convertRubricsMeteInfoToJson(dto.getRubricMetaInfo()));
        }


        assignmentMapper.updateById(existingAssignment);
        
        // Clear cache directly - simpler approach
        try {
            if (oldSubjectId != null && !oldSubjectId.equals(dto.getSubjectId())) {
                cacheSupport.evictBySubjectId(oldSubjectId);
            }
            cacheSupport.evictBySubjectId(dto.getSubjectId());
        } catch (Exception ignore) {
            // Log cache eviction failure but don't fail the operation
        }
        
        return convertToDTO(existingAssignment);
    }

    @Override
    @Transactional
    public void deleteAssignment(Long id) {
        Assignment assignment = assignmentMapper.selectById(id);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // Check if assignment can be deleted (e.g., no submissions)
        // This would be implemented when submission service is created

        assignmentMapper.deleteById(id);

        // Clear cache AFTER successful deletion commit
        final Long sidForEvict = assignment.getSubjectId();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    cacheSupport.evictBySubjectId(sidForEvict);
                } catch (Exception ignore) {
                }
            }
        });
    }

    @Override
    @Cacheable(value = "subjectAssignments", key = "#subjectId")
    public List<AssignmentResponseDTO> getAssignmentsBySubject(Long subjectId) {
        // Validate subject exists
        Subject subject = subjectMapper.selectById(subjectId);
        if (subject == null) {
            throw new BusinessException(BusinessError.SUBJECT_NOT_FOUND);
        }

        // Get all assignments for the subject
        List<Assignment> assignments = assignmentMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Assignment>()
                        .eq(Assignment::getSubjectId, subjectId)
                        .orderByDesc(Assignment::getCreateTime)
        );

        // Convert to DTOs
        return assignments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "subjectAssignmentCount", key = "#subjectId")
    public Integer getAssignmentCountBySubject(Long subjectId) {
        // Validate subject exists
        Subject subject = subjectMapper.selectById(subjectId);
        if (subject == null) {
            throw new BusinessException(BusinessError.SUBJECT_NOT_FOUND);
        }

        // Get assignment count for the subject
        Integer count = Math.toIntExact(assignmentMapper.selectCount(
                new LambdaQueryWrapper<Assignment>()
                        .eq(Assignment::getSubjectId, subjectId)
        ));

        return count;
    }

    @Override
    public Map<Long, Integer> getAssignmentCountsBySubjectIds(List<Long> subjectIds) {
        if (subjectIds == null || subjectIds.isEmpty()) {
            return new java.util.HashMap<>();
        }

        // Use SQL aggregation for batch query
        List<Map<String, Object>> results = assignmentMapper.selectAssignmentCountsBySubjectIds(subjectIds);

        // Convert to Map<Long, Integer>
        Map<Long, Integer> countMap = new java.util.HashMap<>();
        for (Map<String, Object> result : results) {
            Long subjectId = ((Number) result.get("subjectId")).longValue();
            Integer count = ((Number) result.get("assignmentCount")).intValue();
            countMap.put(subjectId, count);
        }

        // Fill in 0 for subjects with no assignments
        for (Long subjectId : subjectIds) {
            countMap.putIfAbsent(subjectId, 0);
        }

        return countMap;
    }

    /**
     * Convert Assignment entity to DTO
     */
    private AssignmentResponseDTO convertToDTO(Assignment assignment) {
        AssignmentResponseDTO dto = new AssignmentResponseDTO();
        BeanUtils.copyProperties(assignment, dto);

        // Convert JSON string back to RubricsInfoDto list
        if (assignment.getRubricsInfo() != null && !assignment.getRubricsInfo().trim().isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                List<RubricsInfoDto> rubricsInfo = mapper.readValue(assignment.getRubricsInfo(),
                        mapper.getTypeFactory().constructCollectionType(List.class, RubricsInfoDto.class));
                dto.setRubricsInfo(rubricsInfo);
            } catch (JsonProcessingException e) {
                // If JSON parsing fails, set to null
                dto.setRubricsInfo(null);
            }
        }

        return dto;
    }

    /**
     * Validate rubrics info
     */
    private void validateRubricsInfo(List<RubricsInfoDto> rubricsInfo) {
        if (rubricsInfo == null || rubricsInfo.isEmpty()) {
            return;
        }

        double totalWeight = 0.0;
        for (RubricsInfoDto rubric : rubricsInfo) {
            // Validate rubric description
            if (rubric.getDescription() == null || rubric.getDescription().trim().isEmpty()) {
                throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_RUBRIC);
            }

            // Validate rubric weight
            if (rubric.getWeight() == null || rubric.getWeight() < 0.0 || rubric.getWeight() > 100.0) {
                throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_RUBRIC_WEIGHT);
            }

            // Validate scale type
            if (rubric.getScaleType() == null || rubric.getScaleType().trim().isEmpty()) {
                throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_SCALE_TYPE);
            }

            // Validate performance levels
            if (rubric.getPerformanceLevel() == null || rubric.getPerformanceLevel().isEmpty()) {
                throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_PERFORMANCE_LEVELS);
            }

            // Validate each performance level
            for (org.swen90017.oas.dto.PerformanceDto performance : rubric.getPerformanceLevel()) {
                if (performance.getDescription() == null || performance.getDescription().trim().isEmpty()) {
                    throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_PERFORMANCE_DESCRIPTION);
                }
                if (performance.getStartPoint() == null || performance.getEndPoint() == null ||
                        performance.getStartPoint() < 0.0 || performance.getEndPoint() < 0.0 ||
                        performance.getStartPoint() > performance.getEndPoint()) {
                    throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_PERFORMANCE_POINTS);
                }
            }

            totalWeight += rubric.getWeight();
        }

        // Validate total weight is reasonable (should be close to 100%)
        if (Math.abs(totalWeight - 100.0) > 5.0) {
            throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_TOTAL_WEIGHT);
        }
    }

    /**
     * Convert RubricsInfoDto list to JSON string
     */
    private String convertRubricsInfoToJson(List<RubricsInfoDto> rubricsInfo) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.writeValueAsString(rubricsInfo);
        } catch (JsonProcessingException e) {
            throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_RUBRIC_FORMAT);
        }
    }

    /**
     * Convert RubricsInfoDto list to JSON string
     */
    private String convertRubricsMeteInfoToJson(RubricMetaInfo rubricMetaInfo) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.writeValueAsString(rubricMetaInfo);
        } catch (JsonProcessingException e) {
            throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_RUBRIC_FORMAT);
        }
    }

    /**
     * Validate assignment type
     */
    private boolean isValidAssignmentType(String type) {
        if (type == null || type.trim().isEmpty()) {
            return false;
        }
        try {
            AssignmentType.fromCode(type);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public AssignmentStatusStatsResponseDTO getAssignmentStatusStats() {
        // Get all assignments
        List<Assignment> assignments = assignmentMapper.selectList(null);
        
        return buildStatusStats(assignments);
    }

    @Override
    public AssignmentStatusStatsResponseDTO getAssignmentStatusStatsBySubject(Long subjectId) {
        // Validate subject exists
        Subject subject = subjectMapper.selectById(subjectId);
        if (subject == null) {
            throw new BusinessException(BusinessError.SUBJECT_NOT_FOUND);
        }
        
        // Get assignments by subject ID
        LambdaQueryWrapper<Assignment> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Assignment::getSubjectId, subjectId);
        List<Assignment> assignments = assignmentMapper.selectList(queryWrapper);
        
        return buildStatusStats(assignments);
    }

    /**
     * Build status statistics from assignment list
     */
    private AssignmentStatusStatsResponseDTO buildStatusStats(List<Assignment> assignments) {
        int totalCount = assignments.size();
        
        // Count assignments by status
        Map<String, Integer> statusCounts = assignments.stream()
                .collect(Collectors.groupingBy(
                        assignment -> assignment.getStatus() != null ? assignment.getStatus() : "UNKNOWN",
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));
        
        // Calculate total weight by status
        Map<String, Double> statusWeights = assignments.stream()
                .collect(Collectors.groupingBy(
                        assignment -> assignment.getStatus() != null ? assignment.getStatus() : "UNKNOWN",
                        Collectors.summingDouble(assignment -> assignment.getWeight() != null ? assignment.getWeight() : 0.0)
                ));
        
        // Calculate total weight across all assignments
        double totalWeight = assignments.stream()
                .mapToDouble(assignment -> assignment.getWeight() != null ? assignment.getWeight() : 0.0)
                .sum();
        
        // Calculate percentages based on total weight
        Map<String, Double> statusPercentages = statusWeights.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> totalWeight > 0 ? (entry.getValue()) * 1.0 : 0.0
                ));
        
        return AssignmentStatusStatsResponseDTO.builder()
                .totalCount(totalCount)
                .statusCounts(statusCounts)
                .statusPercentages(statusPercentages)
                .build();
    }

    /**
     * Validate that the total weight of assignments for a subject does not exceed 100%
     * 
     * @param subjectId The subject ID to validate
     * @param newWeight The new weight to be added/updated
     * @param excludeAssignmentId The assignment ID to exclude from calculation (for updates)
     */
    private void validateTotalWeightForSubject(Long subjectId, Double newWeight, Long excludeAssignmentId) {
        // Get all existing assignments for the subject
        LambdaQueryWrapper<Assignment> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Assignment::getSubjectId, subjectId);
        
        // Exclude the current assignment if updating
        if (excludeAssignmentId != null) {
            queryWrapper.ne(Assignment::getId, excludeAssignmentId);
        }
        
        List<Assignment> existingAssignments = assignmentMapper.selectList(queryWrapper);
        
        // Calculate total weight of existing assignments
        double existingTotalWeight = existingAssignments.stream()
                .mapToDouble(assignment -> assignment.getWeight() != null ? assignment.getWeight() : 0.0)
                .sum();
        
        // Check if adding new weight would exceed 100%
        double totalWeight = existingTotalWeight + newWeight;
        if (totalWeight > 100.0) {
            throw new BusinessException(BusinessError.ASSIGNMENT_TOTAL_WEIGHT_EXCEEDED);
        }
    }
}
