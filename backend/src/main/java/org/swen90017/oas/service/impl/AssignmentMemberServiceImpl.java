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
import org.swen90017.oas.enums.UserRole;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.AssignmentMemberService;
import org.swen90017.oas.service.EmailService;
import org.swen90017.oas.service.StudentTimeSlotService;

import java.security.SecureRandom;
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
    private final TimeSlotExaminersMapper timeSlotExaminersMapper;
    private final TimeSlotMapper timeSlotMapper;
    private final ExaminerMapper examinerMapper;
    private final SysStudentMapper sysStudentMapper;
    private final EmailService emailService;
    private final StudentTimeSlotService studentTimeSlotService;

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
        Map<Long, Integer> examinerAssigned = countExaminerAssignedSlots(assignmentId, userIds);

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
            }
            dto.setAddedAt(null);

            if (r == UserRole.STUDENT) {
                dto.setBookingsCount(studentBookings.getOrDefault(ap.getUserId(), 0));
                // group id best-effort
                SysStudentGroup sg = sysStudentGroupMapper.selectById(ap.getUserId());
                dto.setGroupId(sg != null ? sg.getGroupId() : null);
            } else if (r == UserRole.EXAMINER) {
                dto.setAssignedSlotsCount(examinerAssigned.getOrDefault(ap.getUserId(), 0));
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
        link.setIfJoin(1);
        assignmentParticipantMapper.insert(link);

        boolean inviteSent = false;
        if (created) {
            if (Objects.equals(normalizedRole, UserRole.EXAMINER.code())) {
                // create examiner row with token
                SysExaminer ex = new SysExaminer();
                ex.setUserId(user.getUserId());
                ex.setToken(generateToken());
                ex.setSisUserId(localPart(request.getEmail()));
                examinerMapper.insert(ex);
                emailService.sendExaminerActivationEmail(Collections.singletonList(ex));
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
                emailService.sendActivationEmail(Collections.singletonList(st));
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
            for (SlotSession s : sessions) {
                slotSessionMapper.unbook(s.getSessionId());
                canceled++;
            }
        } else if (r == UserRole.EXAMINER) {
            List<TimeSlot> slots = timeSlotExaminersMapper.listSlotsByExaminer(ap.getUserId(), assignmentId);
            for (TimeSlot ts : slots) {
                int removed = timeSlotExaminersMapper.deleteOne(ts.getSlotId(), ap.getUserId());
                if (removed > 0) {
                    int newCurrent = Math.max(0, (ts.getCurrentExaminers() == null ? 0 : ts.getCurrentExaminers()) - 1);
                    int booked = ts.getBookedSessions() == null ? 0 : ts.getBookedSessions();
                    timeSlotMapper.updateCountersAndStatus(ts.getSlotId(), newCurrent, booked);
                    cleared++;
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

    private Map<Long, Integer> countExaminerAssignedSlots(Long assignmentId, List<Long> userIds) {
        Map<Long, Integer> out = new HashMap<>();
        for (Long uid : userIds) {
            List<TimeSlot> slots = timeSlotExaminersMapper.listSlotsByExaminer(uid, assignmentId);
            if (slots != null && !slots.isEmpty()) out.put(uid, slots.size());
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


