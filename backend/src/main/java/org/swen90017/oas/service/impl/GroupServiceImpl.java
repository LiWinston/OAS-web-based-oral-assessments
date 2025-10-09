package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.dto.request.GroupCSVRequestDTO;
import org.swen90017.oas.dto.response.GroupPreviewCSVResponseDTO;
import org.swen90017.oas.entity.*;
import org.swen90017.oas.enums.UserRole;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.BaseCsvImportService;
import org.swen90017.oas.service.GroupService;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class GroupServiceImpl implements GroupService {
    @Autowired
    private SysStudentMapper studentMapper;
    @Autowired
    private SysStudentGroupMapper studentGroupMapper;
    @Autowired
    private GroupMapper groupMapper;
    @Autowired
    private BaseCsvImportService baseCsvImportService;
    @Autowired
    private AssignmentMapper assignmentMapper;
    @Autowired
    private AssignmentParticipantMapper assignmentParticipantMapper;
    @Autowired
    private SysUserMapper sysUserMapper;

    @Override
    @Transactional
    public List<SysStudent> importGroupData(List<GroupCSVRequestDTO> dtos, Long assignmentId) {
        log.info("Importing {} group data records for assignment {}", dtos.size(), assignmentId);

        // Validate that assignment exists and has correct type (group or mixed)
        if (assignmentId != null) {
            Assignment assignment = assignmentMapper.selectById(assignmentId);
            if (assignment != null) {
                String assignmentType = assignment.getType();
                if (!"group".equalsIgnoreCase(assignmentType) && !"mixed".equalsIgnoreCase(assignmentType)) {
                    throw new IllegalArgumentException(
                        String.format("Assignment %d has type '%s', but group/mix CSV import requires 'group' or 'mixed' type", 
                        assignmentId, assignmentType)
                    );
                }
                log.info("Validated assignment {} has type '{}' for group CSV import", assignmentId, assignmentType);
            }
            
            // Re-import semantics: atomically update groups for this assignment
            handleReImport(dtos, assignmentId);
        }

        // Use base service to import student data
        List<SysStudent> sysStudents = baseCsvImportService.importStudents(
                dtos,
                GroupCSVRequestDTO::getStudentId,    // Student ID extractor (maps to "Student Id")
                GroupCSVRequestDTO::getStudent,      // Username extractor (maps to "Student")
                GroupCSVRequestDTO::getLoginId,      // Login ID extractor (maps to "login_id" column, used to build email)
                GroupCSVRequestDTO::getEmail         // Email extractor
        );

        // Process group-related business logic (for all students including existing ones)
        processGroupRelations(dtos, assignmentId);
        
        // Process assignment participants for existing students
        if (assignmentId != null) {
            processExistingStudents(dtos, sysStudents, assignmentId);
        }

        log.info("Successfully imported {} students with group relations for assignment {}", sysStudents.size(), assignmentId);
        return sysStudents;
    }

    /**
     * Handle re-import semantics: atomically update groups and participants
     */
    private void handleReImport(List<GroupCSVRequestDTO> dtos, Long assignmentId) {
        log.info("Handling re-import for assignment {} groups", assignmentId);
        
        // Get canvas_group_ids from CSV
        Set<String> csvGroupIds = dtos.stream()
                .map(GroupCSVRequestDTO::getCanvasGroupId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        
        // Get all existing groups for this assignment
        QueryWrapper<SysGroup> groupWrapper = new QueryWrapper<>();
        groupWrapper.eq("assignment_id", assignmentId);
        List<SysGroup> existingGroups = groupMapper.selectList(groupWrapper);
        
        if (!existingGroups.isEmpty()) {
            // Find groups to remove (not in CSV)
            List<Long> groupIdsToRemove = existingGroups.stream()
                    .filter(g -> !csvGroupIds.contains(g.getCanvasGroupId()))
                    .map(SysGroup::getGroupId)
                    .collect(Collectors.toList());
            
            if (!groupIdsToRemove.isEmpty()) {
                log.info("Removing {} groups not in the new CSV", groupIdsToRemove.size());
                
                // Delete student-group relations for these groups
                QueryWrapper<SysStudentGroup> sgWrapper = new QueryWrapper<>();
                sgWrapper.in("group_id", groupIdsToRemove);
                studentGroupMapper.delete(sgWrapper);
                
                // Delete the groups
                groupMapper.deleteBatchIds(groupIdsToRemove);
                log.info("Successfully removed {} groups and their relations", groupIdsToRemove.size());
            }
        }
        
        // Get student identifiers from CSV
        Set<String> csvStudentNumbers = dtos.stream()
                .map(GroupCSVRequestDTO::getStudentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        
        Set<String> csvEmails = dtos.stream()
                .map(dto -> {
                    if (dto.getLoginId() != null && !dto.getLoginId().isEmpty()) {
                        return dto.getLoginId() + "@student.unimelb.edu.au";
                    }
                    return dto.getEmail();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        
        // Remove student participants not in CSV
        QueryWrapper<AssignmentParticipant> wrapper = new QueryWrapper<>();
        wrapper.eq("assignment_id", assignmentId)
               .eq("role_id", UserRole.STUDENT.sort());
        List<AssignmentParticipant> currentParticipants = assignmentParticipantMapper.selectList(wrapper);
        
        if (!currentParticipants.isEmpty()) {
            List<Long> userIds = currentParticipants.stream()
                    .map(AssignmentParticipant::getUserId)
                    .collect(Collectors.toList());
            
            List<SysStudent> students = studentMapper.selectList(
                    new QueryWrapper<SysStudent>().in("user_id", userIds)
            );
            List<SysUser> users = sysUserMapper.selectBatchIds(userIds);
            
            Map<Long, String> userIdToStudentNumber = students.stream()
                    .collect(Collectors.toMap(SysStudent::getUserId, SysStudent::getStudentNumber));
            Map<Long, String> userIdToEmail = users.stream()
                    .collect(Collectors.toMap(SysUser::getUserId, SysUser::getEmail));
            
            List<Long> participantsToRemove = currentParticipants.stream()
                    .filter(p -> {
                        String studentNumber = userIdToStudentNumber.get(p.getUserId());
                        String email = userIdToEmail.get(p.getUserId());
                        
                        boolean inCsvByNumber = studentNumber != null && csvStudentNumbers.contains(studentNumber);
                        boolean inCsvByEmail = email != null && csvEmails.contains(email);
                        
                        return !inCsvByNumber && !inCsvByEmail;
                    })
                    .map(AssignmentParticipant::getId)
                    .collect(Collectors.toList());
            
            if (!participantsToRemove.isEmpty()) {
                log.info("Removing {} student participants not in the new CSV", participantsToRemove.size());
                assignmentParticipantMapper.deleteBatchIds(participantsToRemove);
            }
        }
        
        // Clear existing student-group relations for groups that remain (will be recreated)
        if (!csvGroupIds.isEmpty()) {
            List<SysGroup> remainingGroups = groupMapper.selectList(
                    new QueryWrapper<SysGroup>()
                            .eq("assignment_id", assignmentId)
                            .in("canvas_group_id", csvGroupIds)
            );
            
            if (!remainingGroups.isEmpty()) {
                List<Long> remainingGroupIds = remainingGroups.stream()
                        .map(SysGroup::getGroupId)
                        .collect(Collectors.toList());
                
                QueryWrapper<SysStudentGroup> clearWrapper = new QueryWrapper<>();
                clearWrapper.in("group_id", remainingGroupIds);
                studentGroupMapper.delete(clearWrapper);
                log.info("Cleared student-group relations for {} remaining groups", remainingGroupIds.size());
            }
        }
    }

    /**
     * Process group-related business logic
     */
    private void processGroupRelations(List<GroupCSVRequestDTO> dtos, Long assignmentId) {
        // Create or get group information
        Map<String, SysGroup> groupMap = createOrGetGroups(dtos, assignmentId);
        
        // Create student-group relationships
        createStudentGroupRelations(dtos, groupMap);
    }

    /**
     * Create or get group information
     * Optimized logic: Collect all unique canvas_group_ids, batch query existing ones, then only insert new ones
     */
    private Map<String, SysGroup> createOrGetGroups(List<GroupCSVRequestDTO> dtos, Long assignmentId) {
        Map<String, SysGroup> groupMap = new HashMap<>();
        
        // Step 1: Collect all unique canvas_group_ids and their corresponding group names
        Map<String, String> canvasGroupIdToName = new LinkedHashMap<>();
        for (GroupCSVRequestDTO dto : dtos) {
            String canvasGroupId = dto.getCanvasGroupId();
            if (canvasGroupId != null && !canvasGroupIdToName.containsKey(canvasGroupId)) {
                canvasGroupIdToName.put(canvasGroupId, dto.getGroupName());
            }
        }
        
        if (canvasGroupIdToName.isEmpty()) {
            log.info("No groups to process for assignment {}", assignmentId);
            return groupMap;
        }
        
        // Step 2: Batch query existing groups
        QueryWrapper<SysGroup> queryWrapper = new QueryWrapper<>();
        queryWrapper.in("canvas_group_id", canvasGroupIdToName.keySet());
        if (assignmentId != null) {
            queryWrapper.eq("assignment_id", assignmentId);
        }
        List<SysGroup> existingGroups = groupMapper.selectList(queryWrapper);
        
        // Add existing groups to map
        for (SysGroup group : existingGroups) {
            groupMap.put(group.getCanvasGroupId(), group);
        }
        log.info("Found {} existing groups for assignment {}", existingGroups.size(), assignmentId);
        
        // Step 3: Find new canvas_group_ids and batch insert
        List<SysGroup> newGroups = new ArrayList<>();
        for (Map.Entry<String, String> entry : canvasGroupIdToName.entrySet()) {
            String canvasGroupId = entry.getKey();
            if (!groupMap.containsKey(canvasGroupId)) {
                SysGroup group = new SysGroup();
                group.setGroupName(entry.getValue());
                group.setCanvasGroupId(canvasGroupId);
                group.setAssignmentId(assignmentId);
                group.setCreateTime(LocalDateTime.now());
                newGroups.add(group);
            }
        }
        
        // Batch insert new groups
        if (!newGroups.isEmpty()) {
            for (SysGroup group : newGroups) {
                groupMapper.insert(group);
                groupMap.put(group.getCanvasGroupId(), group);
            }
            log.info("Created {} new groups for assignment {}", newGroups.size(), assignmentId);
        }
        
        log.info("Processed total {} groups for assignment {}", groupMap.size(), assignmentId);
        return groupMap;
    }

    /**
     * Create student-group relationships
     */
    private void createStudentGroupRelations(List<GroupCSVRequestDTO> dtos, Map<String, SysGroup> groupMap) {
        List<SysStudentGroup> relations = new ArrayList<>();
        
        for (GroupCSVRequestDTO dto : dtos) {
            SysStudent student = studentMapper.selectOne(new QueryWrapper<SysStudent>()
                    .eq("student_number", dto.getStudentId()));
            SysGroup group = groupMap.get(dto.getCanvasGroupId());
            
            if (student != null && group != null) {
                relations.add(new SysStudentGroup(student.getUserId(), group.getGroupId()));
            } else {
                log.warn("Failed to create relation for student: {}, group: {}", 
                        dto.getStudentId(), dto.getCanvasGroupId());
            }
        }

        if (!relations.isEmpty()) {
            studentGroupMapper.batchInsert(relations);
            log.info("Created {} student-group relations", relations.size());
        }
    }

    /**
     * Process existing students - add them to assignment participants
     * Also handles case where sys_user exists but sys_student doesn't
     */
    private void processExistingStudents(List<GroupCSVRequestDTO> dtos, List<SysStudent> newStudents, Long assignmentId) {
        // Get all student IDs from CSV
        Set<String> allIds = dtos.stream()
                .map(GroupCSVRequestDTO::getStudentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        
        // Get new student IDs
        Set<String> newIds = newStudents.stream()
                .map(SysStudent::getStudentNumber)
                .collect(Collectors.toSet());
        
        // Calculate existing student IDs
        Set<String> existingIds = new HashSet<>(allIds);
        existingIds.removeAll(newIds);
        
        if (existingIds.isEmpty()) {
            log.debug("No existing students to process for assignment {}", assignmentId);
            return;
        }
        
        log.info("Processing {} existing students for assignment {}", existingIds.size(), assignmentId);
        
        // Query existing students
        List<SysStudent> existingStudents = studentMapper.selectList(
                new QueryWrapper<SysStudent>().in("student_number", existingIds)
        );
        
        // Create a map for quick lookup
        Map<String, SysStudent> existingStudentMap = existingStudents.stream()
                .collect(Collectors.toMap(SysStudent::getStudentNumber, s -> s));
        
        // Create a map of student_id -> DTO for processing
        Map<String, GroupCSVRequestDTO> dtoMap = dtos.stream()
                .filter(dto -> existingIds.contains(dto.getStudentId()))
                .collect(Collectors.toMap(GroupCSVRequestDTO::getStudentId, dto -> dto, (a, b) -> a));
        
        // Add them to assignment participants
        for (String studentId : existingIds) {
            SysStudent student = existingStudentMap.get(studentId);
            GroupCSVRequestDTO dto = dtoMap.get(studentId);
            
            if (student != null) {
                // Student record exists with this student_number - just add to assignment participant
                addToAssignmentParticipant(student, assignmentId);
            } else if (dto != null) {
                // Student record with this student_number doesn't exist
                // But the email might belong to an existing student with different student_number
                String loginId = dto.getLoginId();
                if (loginId != null) {
                    String email = loginId + "@student.unimelb.edu.au";
                    SysUser user = sysUserMapper.selectOne(new QueryWrapper<SysUser>().eq("email", email));
                    
                    if (user != null) {
                        // User exists - find student record by user_id
                        SysStudent existingStudent = studentMapper.selectOne(
                                new QueryWrapper<SysStudent>().eq("user_id", user.getUserId())
                        );
                        
                        if (existingStudent != null) {
                            // Student exists but with different student_number
                            log.info("Student with email {} exists with student_number={}, CSV has student_number={}. Using existing student record.", 
                                    email, existingStudent.getStudentNumber(), studentId);
                            // Use the existing student record
                            addToAssignmentParticipant(existingStudent, assignmentId);
                        } else {
                            // User exists but no student record - shouldn't happen for @student.unimelb.edu.au
                            log.warn("User with email {} (user_id={}) exists but has no sys_student record. Data inconsistency detected.", 
                                    email, user.getUserId());
                        }
                    } else {
                        // Neither user nor student exists - this shouldn't happen as BaseCsvImportService filtered it
                        log.warn("Student {} does not exist in sys_user table (email not found). This should have been handled by BaseCsvImportService.", studentId);
                    }
                } else {
                    log.warn("Cannot process student {} - missing SIS Login ID", studentId);
                }
            }
        }
    }
    
    /**
     * Add student to assignment participant if not already exists
     */
    private void addToAssignmentParticipant(SysStudent student, Long assignmentId) {
        // Check if already a participant
        QueryWrapper<AssignmentParticipant> existsWrapper = new QueryWrapper<>();
        existsWrapper.eq("assignment_id", assignmentId)
                .eq("user_id", student.getUserId())
                .last("limit 1");
        AssignmentParticipant existing = assignmentParticipantMapper.selectOne(existsWrapper);
        
        if (existing != null) {
            log.debug("Student {} already a participant in assignment {}", student.getStudentNumber(), assignmentId);
            return;
        }
        
        // Create assignment participant
        AssignmentParticipant participant = new AssignmentParticipant();
        participant.setAssignmentId(assignmentId);
        participant.setUserId(student.getUserId());
        participant.setRoleId(UserRole.STUDENT.sort());
        participant.setIfJoin(0); // Set to 0 on import; changed to 1 when released to students
        assignmentParticipantMapper.insert(participant);
        log.info("Linked existing student {} to assignment {} as STUDENT", student.getUserId(), assignmentId);
    }

    @Override
    @SuppressWarnings("unchecked")
    public GroupPreviewCSVResponseDTO previewGroupImport(List<GroupCSVRequestDTO> groupDTOs) {
        log.info("Previewing {} group records from CSV request", groupDTOs.size());

        Map<String, Object> previewData = baseCsvImportService.previewImport(
                groupDTOs,
                GroupCSVRequestDTO::getStudentId,    // Maps to "Student Id"
                GroupCSVRequestDTO::getLoginId       // Maps to "login_id" column
        );

        // Calculate unique group count
        long uniqueGroupCount = groupDTOs.stream()
                .map(GroupCSVRequestDTO::getCanvasGroupId)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        // Build preview response
        GroupPreviewCSVResponseDTO previewResponse = new GroupPreviewCSVResponseDTO();
        previewResponse.setNewStudentRecords((List<GroupCSVRequestDTO>) previewData.get("newStudents"));
        previewResponse.setExistingStudentRecords((List<GroupCSVRequestDTO>) previewData.get("existingStudents"));
        previewResponse.setTotalCount((Integer) previewData.get("totalCount"));
        previewResponse.setNewCount((Integer) previewData.get("newCount"));
        previewResponse.setExistingCount((Integer) previewData.get("existingCount"));
        previewResponse.setGroupCount((int) uniqueGroupCount);

        log.info("Preview complete: {} new students, {} existing students, {} unique groups", 
                previewResponse.getNewCount(), previewResponse.getExistingCount(), uniqueGroupCount);

        return previewResponse;
    }
}
