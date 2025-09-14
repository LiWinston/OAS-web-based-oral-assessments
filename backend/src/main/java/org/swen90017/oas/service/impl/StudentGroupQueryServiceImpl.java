package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.CommonError;
import org.swen90017.oas.dto.response.GroupDetailDTO;
import org.swen90017.oas.dto.response.GroupSummaryDTO;
import org.swen90017.oas.entity.*;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.StudentGroupQueryService;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentGroupQueryServiceImpl implements StudentGroupQueryService {

    private final SysStudentMapper sysStudentMapper;
    private final SysUserMapper sysUserMapper;
    private final SysStudentGroupMapper sysStudentGroupMapper;
    private final GroupMapper groupMapper;
    private final AssignmentMapper assignmentMapper;
    private final SubjectMapper subjectMapper;
    private final AssignmentParticipantMapper assignmentParticipantMapper;

    @Override
    public GroupListResponse listStudentGroups(Long studentId, String status, int pageNum, int pageSize, String sort, String ifModifiedSince) {
        SysUser student = sysUserMapper.selectById(studentId);
        if (student == null) {
            throw new BusinessException(BusinessError.USER_NOT_FOUND);
        }

        // 1) 所有该学生的组关系（一次查）
        List<SysStudentGroup> relations = sysStudentGroupMapper.selectList(
                new LambdaQueryWrapper<SysStudentGroup>().eq(SysStudentGroup::getUserId, studentId));
        if (relations.isEmpty()) {
            GroupListResponse resp = new GroupListResponse();
            resp.setTotal(0);
            resp.setData(new ArrayList<>());
            resp.setLastModified(ZonedDateTime.now(ZoneId.of("UTC")));
            return resp;
        }

        Set<Long> groupIds = relations.stream().map(SysStudentGroup::getGroupId).collect(Collectors.toSet());
        Map<Long, SysGroup> groupById = groupMapper.selectBatchIds(groupIds).stream()
                .collect(Collectors.toMap(SysGroup::getGroupId, Function.identity()));

        // 2) 该学生参与的 assignment（一次查）
        List<AssignmentParticipant> participants = assignmentParticipantMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<AssignmentParticipant>()
                        .eq("user_id", studentId));
        Set<Long> assignmentIds = participants.stream().map(AssignmentParticipant::getAssignmentId).collect(Collectors.toSet());
        List<Assignment> assignments = assignmentIds.isEmpty() ? new ArrayList<>() : assignmentMapper.selectBatchIds(assignmentIds);
        assignments = assignments.stream()
                .filter(a -> Objects.equals(a.getIsReleased(), Boolean.TRUE))
                .filter(a -> "group".equals(a.getType()) || "mixed".equals(a.getType()))
                .collect(Collectors.toList());

        // 3) 批量查 subject 并建映射
        Set<Long> subjectIds = assignments.stream().map(Assignment::getSubjectId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, Subject> subjectById = subjectIds.isEmpty() ? java.util.Collections.emptyMap()
                : subjectMapper.selectBatchIds(subjectIds).stream().collect(Collectors.toMap(Subject::getSubjectId, Function.identity()));

        // 4) 批量查所有这些 group 的成员关系并统计人数
        List<SysStudentGroup> allGroupMembers = sysStudentGroupMapper.selectList(
                new LambdaQueryWrapper<SysStudentGroup>().in(SysStudentGroup::getGroupId, groupIds));
        Map<Long, Long> memberCountByGroup = allGroupMembers.stream()
                .collect(Collectors.groupingBy(SysStudentGroup::getGroupId, Collectors.counting()));

        // 5) 组合：为每个 group 与学生参与的所有符合条件的 assignment 生成一条概览
        List<GroupSummaryDTO> all = new ArrayList<>();
        for (Long gid : groupIds) {
            SysGroup group = groupById.get(gid);
            if (group == null) continue;
            for (Assignment a : assignments) {
                Subject subject = subjectById.get(a.getSubjectId());
                GroupSummaryDTO dto = new GroupSummaryDTO();
                dto.setGroupId(group.getGroupId());
                dto.setGroupName(group.getGroupName());
                dto.setAssignmentId(a.getId());
                dto.setAssignmentName(a.getName());
                dto.setCourseCode(subject != null ? subject.getSubjectCode() : null);
                dto.setSemester(subject != null ? subject.getAcademicYear() + " S" + subject.getSemester() : null);
                dto.setMemberCount(memberCountByGroup.getOrDefault(gid, 0L).intValue());
                dto.setStatus("ACTIVE");
                all.add(dto);
            }
        }

        // Filter status
        if (!"all".equalsIgnoreCase(status)) {
            all = all.stream().filter(d -> "ACTIVE".equals(d.getStatus())).collect(Collectors.toList());
        }

        // Sort
        Comparator<GroupSummaryDTO> cmp = Comparator.comparing(GroupSummaryDTO::getSemester, Comparator.nullsLast(Comparator.naturalOrder()));
        if ("semester_desc".equalsIgnoreCase(sort)) {
            cmp = cmp.reversed();
        }
        all = all.stream().sorted(cmp).collect(Collectors.toList());

        int from = Math.min(pageNum * pageSize, all.size());
        int to = Math.min(from + pageSize, all.size());
        List<GroupSummaryDTO> page = all.subList(from, to);

        GroupListResponse resp = new GroupListResponse();
        resp.setTotal(all.size());
        resp.setData(page);
        resp.setLastModified(ZonedDateTime.now(ZoneId.of("UTC")));
        return resp;
    }

    @Override
    public GroupDetailResponse getGroupDetail(Long studentId, Long groupId, String ifModifiedSince) {
        SysUser student = sysUserMapper.selectById(studentId);
        if (student == null) {
            throw new BusinessException(BusinessError.USER_NOT_FOUND);
        }

        SysGroup group = groupMapper.selectById(groupId);
        if (group == null) {
            throw new BusinessException(CommonError.NOT_FOUND);
        }

        // Check membership
        SysStudentGroup membership = sysStudentGroupMapper.selectOne(new LambdaQueryWrapper<SysStudentGroup>()
                .eq(SysStudentGroup::getUserId, studentId)
                .eq(SysStudentGroup::getGroupId, groupId));
        if (membership == null) {
            throw new BusinessException(CommonError.FORBIDDEN);
        }

        GroupDetailDTO dto = new GroupDetailDTO();
        dto.setGroupId(group.getGroupId());
        dto.setGroupName(group.getGroupName());

        // Best-effort pick latest assignment supporting group this semester (placeholder)
        // 选取该学生参与且支持 group/mixed 的一个 assignment（若存在），批量模式下减少往返
        List<AssignmentParticipant> parts = assignmentParticipantMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<AssignmentParticipant>()
                        .eq("user_id", studentId)
                        .eq("if_join", 1));
        Set<Long> aIds = parts.stream().map(AssignmentParticipant::getAssignmentId).collect(Collectors.toSet());
        List<Assignment> cand = aIds.isEmpty() ? new ArrayList<>() : assignmentMapper.selectBatchIds(aIds);
        Assignment assignment = cand.stream()
                .filter(a -> Objects.equals(a.getIsReleased(), Boolean.TRUE))
                .filter(a -> "group".equals(a.getType()) || "mixed".equals(a.getType()))
                .findFirst().orElse(null);
        if (assignment != null) {
            dto.setAssignmentId(assignment.getId());
            dto.setAssignmentName(assignment.getName());
            Subject subject = subjectMapper.selectById(assignment.getSubjectId());
            dto.setCourseCode(subject != null ? subject.getSubjectCode() : null);
            dto.setSemester(subject != null ? subject.getAcademicYear() + " S" + subject.getSemester() : null);
        }

        List<GroupDetailDTO.Member> members = sysStudentGroupMapper.selectList(new LambdaQueryWrapper<SysStudentGroup>()
                .eq(SysStudentGroup::getGroupId, groupId)).stream().map(rel -> {
            SysUser u = sysUserMapper.selectById(rel.getUserId());
            if (u == null) return null;
            GroupDetailDTO.Member m = new GroupDetailDTO.Member();
            m.setStudentId(u.getUserId());
            m.setName(u.getUserName());
            m.setEmail(u.getEmail());
            return m;
        }).filter(Objects::nonNull).collect(Collectors.toList());
        dto.setMembers(members);

        GroupDetailResponse resp = new GroupDetailResponse();
        resp.setGroup(dto);
        resp.setLastModified(ZonedDateTime.now(ZoneId.of("UTC")));
        return resp;
    }
}


