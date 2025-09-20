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

    @Override
    @Transactional
    public List<SysStudent> importGroupData(List<GroupCSVRequestDTO> dtos) {
        log.info("Importing {} group data records", dtos.size());

        // Use base service to import student data
        List<SysStudent> sysStudents = baseCsvImportService.importStudents(
                dtos,
                GroupCSVRequestDTO::getUserId,    // Student ID extractor
                GroupCSVRequestDTO::getName,      // Username extractor
                GroupCSVRequestDTO::getLoginId,   // SIS user ID extractor
                GroupCSVRequestDTO::getEmail      // Email extractor
        );

        // Process group-related business logic
        processGroupRelations(dtos);

        log.info("Successfully imported {} students with group relations", sysStudents.size());
        return sysStudents;
    }

    /**
     * Process group-related business logic
     */
    private void processGroupRelations(List<GroupCSVRequestDTO> dtos) {
        // Create or get group information
        Map<String, SysGroup> groupMap = createOrGetGroups(dtos);
        
        // Create student-group relationships
        createStudentGroupRelations(dtos, groupMap);
    }

    /**
     * Create or get group information
     */
    private Map<String, SysGroup> createOrGetGroups(List<GroupCSVRequestDTO> dtos) {
        Map<String, SysGroup> groupMap = new HashMap<>();
        
        for (GroupCSVRequestDTO dto : dtos) {
            String canvasGroupId = dto.getCanvasGroupId();
            if (canvasGroupId != null && !groupMap.containsKey(canvasGroupId)) {
                SysGroup group = groupMapper.selectByCanvasGroupId(canvasGroupId);
                if (group == null) {
                    group = new SysGroup();
                    group.setGroupName(dto.getGroupName());
                    group.setCanvasGroupId(canvasGroupId);
                    group.setCreateTime(LocalDateTime.now());
                    groupMapper.insert(group);
                    log.debug("Created new group with ID: {}", group.getGroupId());
                }
                groupMap.put(canvasGroupId, group);
            }
        }
        
        log.info("Processed {} groups", groupMap.size());
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
