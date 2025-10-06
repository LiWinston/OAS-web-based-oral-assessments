package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.AddAssignmentMemberRequestDTO;
import org.swen90017.oas.dto.response.AssignmentMemberCreateResponseDTO;
import org.swen90017.oas.dto.response.AssignmentMemberListResponseDTO;
import org.swen90017.oas.dto.response.AssignmentMemberResponseDTO;
import org.swen90017.oas.dto.response.AssignmentMemberRemoveResponseDTO;
import org.swen90017.oas.entity.*;
import org.swen90017.oas.enums.RegistrationStatus;
import org.swen90017.oas.enums.UserRole;
import org.swen90017.oas.enums.UserStatus;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.AssignmentMemberService;
import org.swen90017.oas.service.EmailService;
import org.swen90017.oas.service.StudentTimeSlotService;

import java.security.SecureRandom;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentMemberServiceImpl implements AssignmentMemberService {

    private final AssignmentParticipantMapper assignmentParticipantMapper;
    private final SysUserMapper sysUserMapper;
    private final SysUserRoleMapper sysUserRoleMapper;
    private final SysRoleMapper sysRoleMapper;
    private final SysStudentGroupMapper sysStudentGroupMapper;
    private final SlotSessionMapper slotSessionMapper;
    private final SessionExaminerMapper sessionExaminersMapper;
    private final ExaminerMapper examinerMapper;
    private final SysStudentMapper sysStudentMapper;
    private final EmailService emailService;
    private final StudentTimeSlotService studentTimeSlotService;
    private final AssignmentMapper assignmentMapper;
    private final SubjectMapper subjectMapper;
    private final AssessmentSubmissionMapper assessmentSubmissionMapper;

    @Override
    public AssignmentMemberListResponseDTO listMembers(Long assignmentId, String role, String q, Integer pageNum, Integer pageSize) {
        Long roleIdFilter = null;
        if (StringUtils.isNotBlank(role)) {
            UserRole r = UserRole.getByCode(role);
            if (r != null) roleIdFilter = r.sort();
        }

        QueryWrapper<AssignmentParticipant> wrapper = new QueryWrapper<>();
        wrapper.eq("assignment_id", assignmentId);
        if (roleIdFilter != null) {
            wrapper.eq("role_id", roleIdFilter);
        }

        // search by email/fullName -> translate into userIds
        List<Long> filterUserIds = null;
        if (StringUtils.isNotBlank(q)) {
            QueryWrapper<SysUser> uw = new QueryWrapper<>();
            uw.like("email", q).or().like("user_name", q);
            List<SysUser> matched = sysUserMapper.selectList(uw);
            filterUserIds = matched.stream().map(SysUser::getUserId).collect(Collectors.toList());
            if (filterUserIds.isEmpty()) {
                AssignmentMemberListResponseDTO empty = new AssignmentMemberListResponseDTO();
                empty.setPageNum(pageNum);
                empty.setPageSize(pageSize);
                empty.setTotal(0L);
                empty.setData(Collections.emptyList());
                return empty;
            }
            wrapper.in("user_id", filterUserIds);
        }

        int current = (pageNum == null ? 0 : Math.max(pageNum, 0)) + 1;
        int size = (pageSize == null ? 25 : Math.max(pageSize, 1));
        Page<AssignmentParticipant> page = new Page<>(current, size);
        Page<AssignmentParticipant> result = assignmentParticipantMapper.selectPage(page, wrapper);

        List<AssignmentParticipant> rows = result.getRecords();
        if (rows.isEmpty()) {
            AssignmentMemberListResponseDTO out = new AssignmentMemberListResponseDTO();
            out.setPageNum(current - 1);
            out.setPageSize(size);
            out.setTotal(result.getTotal());
            out.setData(Collections.emptyList());
            return out;
        }

        // batch load users
        List<Long> userIds = rows.stream().map(AssignmentParticipant::getUserId).distinct().collect(Collectors.toList());
        List<SysUser> users = sysUserMapper.selectBatchIds(userIds);
        Map<Long, SysUser> userById = users.stream().collect(Collectors.toMap(SysUser::getUserId, u -> u));

        // batch counts
        Map<Long, Integer> studentBookings = countStudentBookings(assignmentId, userIds);
        Map<Long, Integer> examinerAssigned = countExaminerAssignedSessions(assignmentId, userIds);

        List<AssignmentMemberResponseDTO> data = new ArrayList<>();
        for (AssignmentParticipant ap : rows) {
            AssignmentMemberResponseDTO dto = new AssignmentMemberResponseDTO();
            dto.setAssignmentUserId(ap.getId());
            dto.setUserId(ap.getUserId());
            UserRole r = Arrays.stream(UserRole.values()).filter(x -> Objects.equals(x.sort(), ap.getRoleId())).findFirst().orElse(null);
            dto.setRole(r != null ? r.code() : null);
            SysUser u = userById.get(ap.getUserId());
            if (u != null) {
                dto.setEmail(u.getEmail());
                dto.setFullName(u.getUserName());
                // Use user's invitation time as Added At
                if (u.getInvitedAt() != null) {
                    dto.setAddedAt(u.getInvitedAt().toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDateTime());
                } else {
                    dto.setAddedAt(null);
                }
            } else {
                dto.setAddedAt(null);
            }

            if (r == UserRole.STUDENT) {
                dto.setBookingsCount(studentBookings.getOrDefault(ap.getUserId(), 0));
                dto.setAssignedSlotsCount(null); // Students do not need assignedSlotsCount
                // group id best-effort - get the first group the student belongs to
                QueryWrapper<SysStudentGroup> groupWrapper = new QueryWrapper<>();
                groupWrapper.eq("user_id", ap.getUserId()).last("limit 1");
                SysStudentGroup sg = sysStudentGroupMapper.selectOne(groupWrapper);
                dto.setGroupId(sg != null ? sg.getGroupId() : null);
            } else if (r == UserRole.EXAMINER) {
                dto.setBookingsCount(null); // Examiners do not need bookingsCount
                dto.setAssignedSlotsCount(examinerAssigned.getOrDefault(ap.getUserId(), 0));
                dto.setGroupId(null); // Examiners do not need groupId
            } else {
                // For other roles or failed role detection, set default values
                dto.setBookingsCount(null);
                dto.setAssignedSlotsCount(null);
                dto.setGroupId(null);
            }
            data.add(dto);
        }

        AssignmentMemberListResponseDTO out = new AssignmentMemberListResponseDTO();
        out.setPageNum(current - 1);
        out.setPageSize(size);
        out.setTotal(result.getTotal());
        out.setData(data);
        return out;
    }

    @Override
    @Transactional
    public AssignmentMemberCreateResponseDTO addMember(Long assignmentId, AddAssignmentMemberRequestDTO request) {
        String normalizedRole = normalizeRole(request.getRole());
        if (!Objects.equals(normalizedRole, UserRole.STUDENT.code()) && !Objects.equals(normalizedRole, UserRole.EXAMINER.code())) {
            throw new BusinessException(BusinessError.BOOKING_VALIDATION_FAILED);
        }

        // find or create user by email
        SysUser user = sysUserMapper.selectOne(new QueryWrapper<SysUser>().eq("email", request.getEmail()).last("limit 1"));
        boolean created = false;
        if (user == null) {
            user = new SysUser();
            user.setEmail(request.getEmail());
            user.setUserName(StringUtils.isNotBlank(request.getFullName()) ? request.getFullName() : localPart(request.getEmail()));
            user.setStatus(org.swen90017.oas.enums.UserStatus.INACTIVE.code());
            user.setRegistrationStatus(org.swen90017.oas.enums.RegistrationStatus.Pending.code());
            user.setInvitedAt(new java.util.Date());
            // Align with CSV import default password
            user.setPassword("123456");
            sysUserMapper.insert(user);
            created = true;
        }

        // ensure role
        ensureUserRole(user.getUserId(), normalizedRole);

        // Idempotent membership
        AssignmentParticipant existing = assignmentParticipantMapper.selectOne(new QueryWrapper<AssignmentParticipant>()
                .eq("assignment_id", assignmentId)
                .eq("user_id", user.getUserId())
                .last("limit 1"));
        if (existing != null) {
            // already in assignment
            throw new BusinessException(BusinessError.ALREADY_IN_ASSIGNMENT);
        }

        AssignmentParticipant link = new AssignmentParticipant();
        link.setAssignmentId(assignmentId);
        link.setUserId(user.getUserId());
        link.setRoleId(UserRole.getByCode(normalizedRole).sort());
        // When adding members individually, set ifJoin=1 for both examiner and student (effective immediately)
        // This differs from CSV import where students wait until release
        link.setIfJoin(1);
        assignmentParticipantMapper.insert(link);

        boolean inviteSent = false;
        if (created) {
            // New user: send activation email
            if (Objects.equals(normalizedRole, UserRole.EXAMINER.code())) {
                // create examiner row with token
                SysExaminer ex = new SysExaminer();
                ex.setUserId(user.getUserId());
                ex.setToken(generateToken());
                ex.setSisUserId(localPart(request.getEmail()));
                examinerMapper.insert(ex);
                String reason = buildInviteReason(assignmentId);
                emailService.sendExaminerActivationEmail(Collections.singletonList(ex), reason);
                inviteSent = true;
            } else if (Objects.equals(normalizedRole, UserRole.STUDENT.code())) {
                // create student row with token
                SysStudent st = new SysStudent();
                st.setUserId(user.getUserId());
                st.setToken(generateToken());
                st.setSisUserId(localPart(request.getEmail()));
                if (StringUtils.isNotBlank(request.getStudentId())) {
                    st.setStudentNumber(request.getStudentId());
                }
                // direct insert via mapper
                sysStudentMapper.insert(st);
                String reason = buildInviteReason(assignmentId);
                emailService.sendActivationEmail(Collections.singletonList(st), reason);
                inviteSent = true;
            }
        } else {
            // Existing user: if already registered, send course-join notification
            boolean isRegistered = UserStatus.ACTIVE.code().equals(user.getStatus())
                    && RegistrationStatus.REGISTERED.code().equals(user.getRegistrationStatus());
            
            if (isRegistered) {
                // Fetch course and assignment information
                Assignment assignment = assignmentMapper.selectById(assignmentId);
                Subject subject = null;
                if (assignment != null) {
                    subject = subjectMapper.selectById(assignment.getSubjectId());
                }
                String courseName = subject != null ? subject.getSubjectName() : null;
                String assignmentName = assignment != null ? assignment.getName() : null;
                
                // Send course-join notification
                if (Objects.equals(normalizedRole, UserRole.EXAMINER.code())) {
                    emailService.sendExaminerCourseJoinNotification(Collections.singletonList(user), courseName, assignmentName);
                } else if (Objects.equals(normalizedRole, UserRole.STUDENT.code())) {
                    emailService.sendCourseJoinNotification(Collections.singletonList(user), courseName, assignmentName);
                }
                inviteSent = true;
            }
        }

        AssignmentMemberCreateResponseDTO resp = new AssignmentMemberCreateResponseDTO();
        resp.setAssignmentUserId(link.getId());
        resp.setUserId(user.getUserId());
        resp.setCreated(created);
        resp.setLinked(true);
        resp.setEmail(user.getEmail());
        resp.setRole(normalizedRole);
        resp.setInviteSent(inviteSent);
        return resp;
    }

    private String buildInviteReason(Long assignmentId) {
        if (assignmentId == null) return null;
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) return null;
        Subject subject = subjectMapper.selectById(assignment.getSubjectId());
        String courseCode = subject != null && subject.getSubjectCode() != null ? subject.getSubjectCode() : "N/A";
        String courseName = subject != null && subject.getSubjectName() != null ? subject.getSubjectName() : "N/A";
        String assignmentCode = assignment.getId() != null ? String.valueOf(assignment.getId()) : "N/A";
        String assignmentName = assignment.getName() != null ? assignment.getName() : "N/A";
        return "Course " + courseCode + " " + courseName + " · Assignment " + assignmentCode + " " + assignmentName;
    }

    @Override
    @Transactional
    public AssignmentMemberRemoveResponseDTO removeMember(Long assignmentId, Long assignmentUserId) {
        AssignmentParticipant ap = assignmentParticipantMapper.selectById(assignmentUserId);
        if (ap == null || !Objects.equals(ap.getAssignmentId(), assignmentId)) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        UserRole r = Arrays.stream(UserRole.values()).filter(x -> Objects.equals(x.sort(), ap.getRoleId())).findFirst().orElse(null);

        int canceled = 0;
        int cleared = 0;
        if (r == UserRole.STUDENT) {
            // find active bookings and unbook
            List<SlotSession> sessions = studentTimeSlotService.findActiveBookingByStudent(ap.getUserId(), assignmentId);
            
            // Check if any session has submitted assessments
            for (SlotSession s : sessions) {
                Long submittedCount = assessmentSubmissionMapper.countSubmittedAssessmentsBySession(s.getSessionId());
                if (submittedCount != null && submittedCount > 0) {
                    throw new BusinessException("Cannot remove member: this student has submitted assessments in some sessions");
                }
            }
            
            // If no submitted assessments, proceed to unbook
            for (SlotSession s : sessions) {
                slotSessionMapper.unbook(s.getSessionId());
                canceled++;
            }
        } else if (r == UserRole.EXAMINER) {
            List<SlotSession> sessions = sessionExaminersMapper.listSessionsByExaminer(ap.getUserId(), assignmentId);
            
            // Check if examiner has any submitted assessments in any session
            for (SlotSession session : sessions) {
                Long submittedCount = assessmentSubmissionMapper.countSubmittedAssessmentsBySessionAndExaminer(
                    session.getSessionId(), ap.getUserId());
                if (submittedCount != null && submittedCount > 0) {
                    throw new BusinessException("Cannot remove member: this examiner has submitted assessments in some sessions");
                }
            }
            
            // If no submitted assessments, proceed to remove examiner from sessions
            for (SlotSession session : sessions) {
                // Remove examiner assignment from session_examiners by sessionId
                int removed = sessionExaminersMapper.deleteOne(session.getSessionId(), ap.getUserId());
                if (removed > 0) {
                    cleared++;
                    // Note: in slot session mode, no need to update time slot counters
                    // because the time slot concept has been removed; each session is managed independently
                }
            }
        }

        assignmentParticipantMapper.deleteById(assignmentUserId);

        AssignmentMemberRemoveResponseDTO out = new AssignmentMemberRemoveResponseDTO();
        out.setAssignmentUserId(assignmentUserId);
        out.setRole(r != null ? r.code() : null);
        out.setCanceledBookings(canceled);
        out.setClearedExaminerSlots(cleared);
        return out;
    }

    private String normalizeRole(String role) {
        if (role == null) return null;
        return role.startsWith("ROLE_") ? role : ("ROLE_" + role.toUpperCase());
    }

    private void ensureUserRole(Long userId, String roleKey) {
        SysUserRole existing = sysUserRoleMapper.selectByUserId(userId);
        Long expectRoleId = getRoleIdByKey(roleKey);
        if (existing == null || !Objects.equals(existing.getRoleId(), expectRoleId)) {
            sysUserRoleMapper.insert(new SysUserRole(userId, expectRoleId));
        }
    }

    private Long getRoleIdByKey(String roleKey) {
        QueryWrapper<SysRole> w = new QueryWrapper<>();
        w.eq("role_key", roleKey).last("limit 1");
        SysRole role = sysRoleMapper.selectOne(w);
        return role != null ? role.getRoleId() : null;
    }

    private Map<Long, Integer> countStudentBookings(Long assignmentId, List<Long> userIds) {
        // naive per-user loop using existing mapper method; can be optimized to batch SQL later
        Map<Long, Integer> out = new HashMap<>();
        for (Long uid : userIds) {
            List<SlotSession> sessions = studentTimeSlotService.findActiveBookingByStudent(uid, assignmentId);
            if (sessions != null && !sessions.isEmpty()) out.put(uid, sessions.size());
        }
        return out;
    }

    private Map<Long, Integer> countExaminerAssignedSessions(Long assignmentId, List<Long> userIds) {
        Map<Long, Integer> out = new HashMap<>();
        for (Long uid : userIds) {
            List<SlotSession> sessions = sessionExaminersMapper.listSessionsByExaminer(uid, assignmentId);
            if (sessions != null && !sessions.isEmpty()) out.put(uid, sessions.size());
        }
        return out;
    }

    private String localPart(String email) {
        int idx = email.indexOf('@');
        return idx > 0 ? email.substring(0, idx) : email;
    }

    private String generateToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    // no-op
}


