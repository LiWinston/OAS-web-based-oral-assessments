package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.dto.request.GroupCSVRequestDTO;
import org.swen90017.oas.dto.response.GroupPreviewCSVResponseDTO;
import org.swen90017.oas.entity.*;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.BaseCsvImportService;
import org.swen90017.oas.service.GroupService;

import java.time.LocalDateTime;
import java.util.*;

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
        }

        // Use base service to import student data
        List<SysStudent> sysStudents = baseCsvImportService.importStudents(
                dtos,
                GroupCSVRequestDTO::getUserId,    // Student ID extractor
                GroupCSVRequestDTO::getName,      // Username extractor
                GroupCSVRequestDTO::getLoginId,   // SIS user ID extractor
                GroupCSVRequestDTO::getEmail      // Email extractor
        );

        // Process group-related business logic
        processGroupRelations(dtos, assignmentId);

        log.info("Successfully imported {} students with group relations for assignment {}", sysStudents.size(), assignmentId);
        return sysStudents;
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
     */
    private Map<String, SysGroup> createOrGetGroups(List<GroupCSVRequestDTO> dtos, Long assignmentId) {
        Map<String, SysGroup> groupMap = new HashMap<>();
        
        for (GroupCSVRequestDTO dto : dtos) {
            String canvasGroupId = dto.getCanvasGroupId();
            if (canvasGroupId != null && !groupMap.containsKey(canvasGroupId)) {
                // Look for existing group with same canvas_group_id and assignment_id
                QueryWrapper<SysGroup> queryWrapper = new QueryWrapper<>();
                queryWrapper.eq("canvas_group_id", canvasGroupId);
                if (assignmentId != null) {
                    queryWrapper.eq("assignment_id", assignmentId);
                }
                SysGroup group = groupMapper.selectOne(queryWrapper);
                
                if (group == null) {
                    group = new SysGroup();
                    group.setGroupName(dto.getGroupName());
                    group.setCanvasGroupId(canvasGroupId);
                    group.setAssignmentId(assignmentId);
                    group.setCreateTime(LocalDateTime.now());
                    groupMapper.insert(group);
                    log.debug("Created new group with ID: {} for assignment: {}", group.getGroupId(), assignmentId);
                }
                groupMap.put(canvasGroupId, group);
            }
        }
        
        log.info("Processed {} groups for assignment {}", groupMap.size(), assignmentId);
        return groupMap;
    }

    /**
     * Create student-group relationships
     */
    private void createStudentGroupRelations(List<GroupCSVRequestDTO> dtos, Map<String, SysGroup> groupMap) {
        List<SysStudentGroup> relations = new ArrayList<>();
        
        for (GroupCSVRequestDTO dto : dtos) {
            SysStudent student = studentMapper.selectOne(new QueryWrapper<SysStudent>()
                    .eq("student_number", dto.getUserId()));
            SysGroup group = groupMap.get(dto.getCanvasGroupId());
            
            if (student != null && group != null) {
                relations.add(new SysStudentGroup(student.getUserId(), group.getGroupId()));
            } else {
                log.warn("Failed to create relation for student: {}, group: {}", 
                        dto.getUserId(), dto.getCanvasGroupId());
            }
        }

        if (!relations.isEmpty()) {
            studentGroupMapper.batchInsert(relations);
            log.info("Created {} student-group relations", relations.size());
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public GroupPreviewCSVResponseDTO previewGroupImport(List<GroupCSVRequestDTO> groupDTOs) {
        log.info("Previewing {} group records from CSV request", groupDTOs.size());

        Map<String, Object> previewData = baseCsvImportService.previewImport(
                groupDTOs,
                GroupCSVRequestDTO::getUserId,
                GroupCSVRequestDTO::getLoginId
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
