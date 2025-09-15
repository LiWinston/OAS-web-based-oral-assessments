package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.swen90017.oas.common.BusinessError;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.swen90017.oas.dto.RubricMetaInfo;
import org.swen90017.oas.dto.RubricsInfoDto;
import org.swen90017.oas.dto.request.AssignmentRequestDTO;
import org.swen90017.oas.dto.request.StudentAssignmentQueryRequestDTO;
import org.swen90017.oas.dto.response.AssignmentResponseDTO;
import org.swen90017.oas.dto.response.AssignmentStatusStatsResponseDTO;
import org.swen90017.oas.dto.response.GroupContextResponseDTO;
import org.swen90017.oas.dto.response.StudentAssignmentListResponseDTO;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.entity.Subject;
import org.swen90017.oas.entity.SysGroup;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.entity.SysStudentGroup;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.enums.AssignmentType;
import org.swen90017.oas.enums.SessionStatus;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.GroupMapper;
import org.swen90017.oas.mapper.SysStudentGroupMapper;
import org.swen90017.oas.mapper.SysStudentMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.mapper.SubjectMapper;
import org.swen90017.oas.service.AssignmentService;
import org.swen90017.oas.service.cache.AssignmentCacheSupport;
import org.swen90017.oas.dto.response.StudentAssignmentResponseDTO;
import org.swen90017.oas.dto.response.AssignmentAvailabilityResponseDTO;
import org.swen90017.oas.entity.SlotSession;
import org.swen90017.oas.mapper.TimeSlotMapper;
import org.swen90017.oas.mapper.SlotSessionMapper;
import org.swen90017.oas.constant.AssignmentConstants;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;
import java.util.Objects;

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
    private final GroupMapper groupMapper;
    private final SysStudentGroupMapper sysStudentGroupMapper;
    private final SysStudentMapper sysStudentMapper;
    private final SysUserMapper sysUserMapper;
    private final TimeSlotMapper timeSlotMapper;
    private final SlotSessionMapper slotSessionMapper;

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

    @Override
    public GroupContextResponseDTO getGroupContext(Long studentId, Long assignmentId) {
        // Validate assignment exists
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // Check if assignment supports groups
        if (!"group".equals(assignment.getType()) && !"mixed".equals(assignment.getType())) {
            throw new BusinessException(BusinessError.ASSIGNMENT_INVALID_TYPE);
        }

        // Find the group for this student
        LambdaQueryWrapper<SysStudentGroup> studentGroupQuery = new LambdaQueryWrapper<>();
        studentGroupQuery.eq(SysStudentGroup::getUserId, studentId);
        SysStudentGroup studentGroup = sysStudentGroupMapper.selectOne(studentGroupQuery);
        
        if (studentGroup == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // Get group information
        SysGroup group = groupMapper.selectById(studentGroup.getGroupId());
        if (group == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // Get all members of this group
        LambdaQueryWrapper<SysStudentGroup> groupMembersQuery = new LambdaQueryWrapper<>();
        groupMembersQuery.eq(SysStudentGroup::getGroupId, group.getGroupId());
        List<SysStudentGroup> groupMembers = sysStudentGroupMapper.selectList(groupMembersQuery);

        // Build member information
        List<GroupContextResponseDTO.GroupMemberDTO> members = groupMembers.stream()
                .map(member -> {
                    SysUser user = sysUserMapper.selectById(member.getUserId());
                    if (user != null) {
                        GroupContextResponseDTO.GroupMemberDTO memberDTO = new GroupContextResponseDTO.GroupMemberDTO();
                        memberDTO.setStudentId(user.getUserId());
                        memberDTO.setName(user.getUserName());
                        memberDTO.setEmail(user.getEmail());
                        return memberDTO;
                    }
                    return null;
                })
                .filter(member -> member != null)
                .collect(Collectors.toList());

        // Build response
        GroupContextResponseDTO response = new GroupContextResponseDTO();
        response.setGroupId(group.getGroupId());
        response.setGroupName(group.getGroupName());
        response.setMembers(members);

        return response;
    }

    @Override
    public StudentAssignmentListResponseDTO getStudentAssignments(Long studentId, StudentAssignmentQueryRequestDTO queryDTO) {
        // Validate student exists
        SysStudent student = sysStudentMapper.selectById(studentId);
        if (student == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // Build query wrapper for assignments
        QueryWrapper<Assignment> queryWrapper = new QueryWrapper<>();
        
        // Join with assignment_participant to get assignments for this student
        queryWrapper.inSql("id", 
            "SELECT assignment_id FROM assignment_participant WHERE user_id = " + studentId);

        //TODO 状态判断
        // Apply status filter
        if ("bookable".equals(queryDTO.getStatus())) {
            // Only assignments that are released and have available sessions
            queryWrapper.eq("is_released", true);
        } else if ("booked".equals(queryDTO.getStatus())) {
            // Only assignments where student has active bookings (individual or group)
            queryWrapper.inSql("id",
                "SELECT DISTINCT ss.assignment_id FROM assignment_participant a " +
                "JOIN session_student st ON (" +
                    "(st.type = 'INDIVIDUAL' AND st.subject_id = " + studentId + ") " +
                    "OR " +
                    "(st.type = 'GROUP' AND st.subject_id IN (" +
                        "SELECT sg.group_id FROM sys_student_group sg WHERE sg.user_id = " + studentId + 
                    "))" +
                ") " +
                "JOIN slot_sessions ss ON st.session_id = ss.session_id " +
                "WHERE a.user_id = " + studentId + " AND a.assignment_id = ss.assignment_id");
        }
        // "all" status - no additional filter needed
        
        // Apply sorting
        if ("date_desc".equals(queryDTO.getSort())) {
            queryWrapper.orderByDesc("start_date");
        } else {
            queryWrapper.orderByAsc("start_date"); // default to date_asc
        }
        
        // Apply pagination
        Page<Assignment> page = new Page<>(queryDTO.getPageNum() + 1, queryDTO.getPageSize()); // MyBatis-Plus uses 1-based pagination
        IPage<Assignment> result = assignmentMapper.selectPage(page, queryWrapper);
        
        // Convert to DTOs with batch optimization
        List<StudentAssignmentResponseDTO> assignmentDTOs = convertToStudentAssignmentDTOsBatch(result.getRecords(), studentId);
        
        // Build response
        StudentAssignmentListResponseDTO response = new StudentAssignmentListResponseDTO();
        response.setPageNum(queryDTO.getPageNum());
        response.setPageSize(queryDTO.getPageSize());
        response.setTotal(result.getTotal());
        response.setData(assignmentDTOs);
        
        return response;
    }

    /**
     * Convert Assignment entities to StudentAssignmentResponseDTOs with true batch optimization
     * Uses only 3 SQL queries total regardless of number of assignments
     */
    private List<StudentAssignmentResponseDTO> convertToStudentAssignmentDTOsBatch(List<Assignment> assignments, Long studentId) {
        if (assignments.isEmpty()) {
            return new ArrayList<>();
        }

        // Extract all IDs for batch queries
        List<Long> assignmentIds = assignments.stream()
                .map(Assignment::getId)
                .collect(Collectors.toList());
        
        List<Long> subjectIds = assignments.stream()
                .map(Assignment::getSubjectId)
                .distinct()
                .collect(Collectors.toList());

        // Batch query 1: Get all subjects in one SQL query using IN clause
        final Map<Long, Subject> subjectMap = new HashMap<>();
        if (!subjectIds.isEmpty()) {
            QueryWrapper<Subject> subjectQuery = new QueryWrapper<>();
            subjectQuery.in("subject_id", subjectIds);
            List<Subject> subjects = subjectMapper.selectList(subjectQuery);
            subjectMap.putAll(subjects.stream()
                    .collect(Collectors.toMap(Subject::getSubjectId, s -> s)));
        }

        // Batch query 2: Get all slot sessions for all assignments in one SQL query using IN clause
        final Map<Long, List<SlotSession>> sessionMap = new HashMap<>();
        if (!assignmentIds.isEmpty()) {
            QueryWrapper<SlotSession> sessionQuery = new QueryWrapper<>();
            sessionQuery.in("assignment_id", assignmentIds);
            List<SlotSession> allSessions = slotSessionMapper.selectList(sessionQuery);
            sessionMap.putAll(allSessions.stream()
                    .collect(Collectors.groupingBy(SlotSession::getAssignmentId)));
        }

        // Batch query 3: Check all bookings for the student in one optimized SQL query
        // This includes both individual student bookings and group bookings the student belongs to
        final Set<Long> bookedAssignmentIds = new HashSet<>();
        if (!assignmentIds.isEmpty()) {
            // Use the optimized mapper method to get all booked assignment IDs in one query
            List<Long> bookedIds = slotSessionMapper.getStudentBookedAssignmentIds(studentId, assignmentIds);
            bookedAssignmentIds.addAll(bookedIds);
        }

        // Build DTOs in memory
        return assignments.stream()
                .map(assignment -> buildStudentAssignmentDTO(
                    assignment, 
                    studentId, 
                    subjectMap.get(assignment.getSubjectId()),
                    sessionMap.getOrDefault(assignment.getId(), new ArrayList<>()),
                    bookedAssignmentIds.contains(assignment.getId())
                ))
                .collect(Collectors.toList());
    }

    /**
     * Build StudentAssignmentResponseDTO from individual components
     */
    private StudentAssignmentResponseDTO buildStudentAssignmentDTO(
            Assignment assignment, 
            Long studentId, 
            Subject subject, 
            List<SlotSession> sessions, 
            boolean hasActiveBooking) {
        
        StudentAssignmentResponseDTO dto = new StudentAssignmentResponseDTO();
        
        // Basic assignment information
        dto.setAssignmentId(assignment.getId());
        dto.setAssignmentName(assignment.getName());
        dto.setCourseCode(subject != null ? subject.getSubjectCode() : "Unknown");

        dto.setCourseName(subject != null ? subject.getSubjectName() : "Unknown");
        dto.setAssessmentType(assignment.getType().toUpperCase());
        dto.setSessionDurationMinutes(30); // Default value
        
        // Build booking information
        StudentAssignmentResponseDTO.BookingInfoDTO bookingInfo = new StudentAssignmentResponseDTO.BookingInfoDTO();
        bookingInfo.setHasActiveBooking(hasActiveBooking);
        dto.setBooking(bookingInfo);
        
        // Build availability information
        StudentAssignmentResponseDTO.AvailabilityInfoDTO availabilityInfo = new StudentAssignmentResponseDTO.AvailabilityInfoDTO();
        availabilityInfo.setReleased(assignment.getIsReleased());
        
        if (!sessions.isEmpty()) {
            // Calculate available sessions from slot sessions
            int totalSessions = sessions.size();
            
            // Count booked sessions by checking session_student table
            int bookedSessions = (int) sessions.stream()
                    .filter(session -> session.getEnrolledGroups() != null && session.getEnrolledGroups() > 0)
                    .count();
            
            availabilityInfo.setAvailableSessions(totalSessions - bookedSessions);
            
            // Get earliest and latest session times
            LocalDateTime earliest = sessions.stream()
                    .map(SlotSession::getStartAt)
                    .min(LocalDateTime::compareTo)
                    .orElse(null);
            availabilityInfo.setEarliestSession(earliest);
            
            LocalDateTime latest = sessions.stream()
                    .map(SlotSession::getEndAt)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);
            availabilityInfo.setLatestSession(latest);
        } else {
            availabilityInfo.setAvailableSessions(0);
        }
        
        // Set default values for other availability fields
        availabilityInfo.setReschedulingEnabled(true);
        availabilityInfo.setBookingDeadline(assignment.getEndDate());
        availabilityInfo.setLockoutEnabled(true);
        availabilityInfo.setLockoutWindowHours(24);
        availabilityInfo.setPollingHintSeconds(30);
        
        dto.setAvailability(availabilityInfo);
        
        return dto;
    }

    /**
     * Check if student has an active booking for an assignment
     */
    private boolean hasActiveBooking(Long studentId, Long assignmentId) {
        // Check if student has any booked sessions for this assignment
        QueryWrapper<SlotSession> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("booked_subject_id", studentId)
                   .eq("booked_subject_type", "student")
                   .eq("status", "booked");
        
        // Join with time_slots to filter by assignment
        queryWrapper.inSql("slot_id", 
            "SELECT slot_id FROM time_slots WHERE assignment_id = " + assignmentId);
        
        return slotSessionMapper.selectCount(queryWrapper) > 0;
    }

    @Override
    public AssignmentAvailabilityResponseDTO getAssignmentAvailability(Long assignmentId, Long studentId) {
        // Get assignment details
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // Get subject information
        Subject subject = subjectMapper.selectById(assignment.getSubjectId());
        if (subject == null) {
            throw new BusinessException(BusinessError.SUBJECT_NOT_FOUND);
        }

        // Check if student is enrolled in this subject (basic validation)
        // This could be enhanced with more specific enrollment checks
        if (!isStudentEnrolledInSubject(studentId, assignment.getSubjectId())) {
            throw new BusinessException(BusinessError.FORBIDDEN);
        }

        // Get all slot sessions for this assignment directly
        List<SlotSession> slotSessions = slotSessionMapper.listSessionsByAssignment(assignmentId);

        // Build availability summary from slot sessions
        AssignmentAvailabilityResponseDTO.AvailabilitySummaryDTO summary = buildAvailabilitySummaryFromSessions(slotSessions);

        // Build response DTO
        AssignmentAvailabilityResponseDTO response = new AssignmentAvailabilityResponseDTO();
        response.setAssignmentId(assignmentId);
        response.setAssessmentType(assignment.getType().toUpperCase());
        response.setReleased(assignment.getIsReleased());
        response.setVisibilityRule(AssignmentConstants.DEFAULT_VISIBILITY_RULE);
        response.setReschedulingEnabled(AssignmentConstants.DEFAULT_RESCHEDULING_ENABLED);
        response.setBookingDeadline(assignment.getStartDate().minusDays(1));
        response.setLockoutEnabled(AssignmentConstants.DEFAULT_LOCKOUT_ENABLED);
        response.setLockoutWindowHours(AssignmentConstants.DEFAULT_LOCKOUT_WINDOW_HOURS);
        response.setSummary(summary);
        response.setPollingHintSeconds(AssignmentConstants.DEFAULT_POLLING_HINT_SECONDS);

        return response;
    }

    /**
     * Build availability summary from slot sessions
     */
    private AssignmentAvailabilityResponseDTO.AvailabilitySummaryDTO buildAvailabilitySummaryFromSessions(List<SlotSession> slotSessions) {
        AssignmentAvailabilityResponseDTO.AvailabilitySummaryDTO summary = new AssignmentAvailabilityResponseDTO.AvailabilitySummaryDTO();
        
        if (slotSessions.isEmpty()) {
            summary.setTotalSlots(0);
            summary.setTotalSessions(0);
            summary.setAvailableSessions(0);
            summary.setDaysWithAvailability(new ArrayList<>());
            return summary;
        }

        // Calculate total sessions
        summary.setTotalSessions(slotSessions.size());

        // Calculate total slots (unique slot_ids)
        long totalSlots = slotSessions.stream()
                .map(SlotSession::getSlotId)
                .distinct()
                .count();
        summary.setTotalSlots((int) totalSlots);

        // Calculate available sessions (sessions that are not fully booked)
        long availableSessions = slotSessions.stream()
                .filter(session -> {
                    // Session is available if enrolled_groups < capacity_groups
                    if (session.getCapacityGroups() != null && session.getEnrolledGroups() != null) {
                        return session.getEnrolledGroups() < session.getCapacityGroups();
                    }
                    return false;
                })
                .count();
        summary.setAvailableSessions((int) availableSessions);

        // Get unique dates with availability (only from available sessions)
        Set<String> availableDates = slotSessions.stream()
                .filter(session -> {
                    // Same availability logic as above
                    if (session.getCapacityGroups() != null && session.getEnrolledGroups() != null) {
                        return session.getEnrolledGroups() < session.getCapacityGroups();
                    }
                    return false;
                })
                .filter(session -> session.getStartAt() != null)
                .map(session -> session.getStartAt().toLocalDate().toString())
                .collect(Collectors.toSet());
        summary.setDaysWithAvailability(new ArrayList<>(availableDates));

        return summary;
    }

    /**
     * Check if student is enrolled in the subject
     * This is a basic implementation - could be enhanced with actual enrollment checks
     */
    private boolean isStudentEnrolledInSubject(Long studentId, Long subjectId) {
        // For now, we'll assume the student has access if they can see the assignment
        // In a real implementation, this would check enrollment records
        return true;
    }
}
