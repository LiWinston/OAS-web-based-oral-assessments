package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.CommonError;
import org.swen90017.oas.constant.HttpStatus;
import org.swen90017.oas.dto.request.ListAdminsRequestDTO;
import org.swen90017.oas.dto.request.AdminInviteDTO;
import org.swen90017.oas.dto.request.SuperAdminCourseQueryRequestDTO;
import org.swen90017.oas.dto.response.*;
import org.swen90017.oas.entity.*;
import org.swen90017.oas.enums.UserStatus;
import org.swen90017.oas.enums.RegistrationStatus;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.SysAdminMapper;
import org.swen90017.oas.enums.UserRole;
import org.swen90017.oas.mapper.SysRoleMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.mapper.SysUserRoleMapper;
import org.swen90017.oas.query.AdminListQuery;
import org.swen90017.oas.service.SubjectService;
import org.swen90017.oas.service.SuperAdminService;
import org.swen90017.oas.utils.QueryWrapperUtil;
import org.swen90017.oas.utils.StringUtils;
import org.swen90017.oas.utils.Convert;
import lombok.extern.slf4j.Slf4j;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SuperAdminServiceImpl implements SuperAdminService {

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private SysUserRoleMapper sysUserRoleMapper;

    @Autowired
    private SysRoleMapper sysRoleMapper;

    @Autowired
    private SysAdminMapper sysAdminMapper;
    @Autowired
    private  SubjectService subjectService;
    @Override
    /**
     * List administrator users with pagination and optional filters.
     *
     * <p>Flow:
     * <ol>
     *   <li>Resolve ROLE_ADMIN; return empty result if not found.</li>
     *   <li>Collect userIds that are bound to ROLE_ADMIN; return empty if none.</li>
     *   <li>Convert request into a query object and normalize filter fields (e.g., status).</li>
     *   <li>Build a MyBatis-Plus QueryWrapper, apply sorting and pagination.</li>
     *   <li>Map users to admin view model, enriching with fields from `sys_admin` if present.</li>
     * </ol>
     *
     * @param request request payload including filters, sorting, and paging options
     * @return a response DTO containing admin list and pagination metadata
     */
    public ListAdminsResponseDTO listAdmins(ListAdminsRequestDTO request) {
        // On-demand expiry: mark invitations older than 7 days as EXPIRED (registration workflow), keep primary status INACTIVE
        Calendar expCal = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        expCal.add(Calendar.DAY_OF_MONTH, -7);
        Date expireBefore = expCal.getTime();
        try {
            UpdateWrapper<SysUser> uw = new UpdateWrapper<>();
            uw.eq("status", UserStatus.INACTIVE.code())
              .eq("registration_status", RegistrationStatus.Pending.code())
              .lt("invited_at", expireBefore)
              .set("registration_status", RegistrationStatus.EXPIRED.code());
            sysUserMapper.update(null, uw);
        } catch (Exception ignored) {}

        SysRole adminRole = sysRoleMapper.selectOne(new QueryWrapper<SysRole>().eq("role_key", UserRole.ADMIN.code()));
        if (adminRole == null) {
            log.warn("[SuperAdmin] ROLE_ADMIN not found, returning empty result");
            ListAdminsResponseDTO resp = new ListAdminsResponseDTO();
            resp.setAdmins(Collections.emptyList());
            resp.setPagination(buildPagination(request.getPage(), request.getLimit(), 0L, 0L));
            return resp;
        }

        // Fetch user-role mappings to get all userIds bound to ROLE_ADMIN
        List<SysUserRole> adminUserRoles = sysUserRoleMapper.selectList(
                new QueryWrapper<SysUserRole>().eq("role_id", adminRole.getRoleId())
        );

        if (adminUserRoles.isEmpty()) {
            ListAdminsResponseDTO resp = new ListAdminsResponseDTO();
            resp.setAdmins(Collections.emptyList());
            resp.setPagination(buildPagination(request.getPage(), request.getLimit(), 0L, 0L));
            return resp;
        }

        // Convert request into internal query model
        AdminListQuery query = Convert.convertObject(request, AdminListQuery.class);

        // Normalize human-readable status to DB status code
        if (StringUtils.isNotEmpty(request.getStatus())) {
            String s = request.getStatus().toUpperCase();
            if (Objects.equals(s, "ACTIVE")) {
                query.setStatus(UserStatus.ACTIVE.code());
            } else if (Objects.equals(s, "INACTIVE")) {
                query.setStatus(UserStatus.INACTIVE.code());
            }
        }
        if (StringUtils.isNotEmpty(request.getRegistrationStatus())) {
            String s = request.getRegistrationStatus().toUpperCase();
            if (Objects.equals(s, "PENDING")) {
                query.setStatus(RegistrationStatus.Pending.code());
            } else if (Objects.equals(s, "REGISTERED")) {
                query.setStatus(RegistrationStatus.REGISTERED.code());
            }else if (Objects.equals(s, "EXPIRED")) {
                query.setStatus(RegistrationStatus.EXPIRED.code());
            }
        }
        // Build dynamic query conditions
        QueryWrapper<SysUser> wrapper = QueryWrapperUtil.build(query, SysUser.class);

        // Apply sorting (default by create_time)
        String sortBy = StringUtils.isNotEmpty(request.getSortBy()) ? request.getSortBy() : "create_time";
        boolean asc = StringUtils.equalsIgnoreCase(request.getSortOrder(), "asc");
        wrapper.orderBy(true, asc, sortBy);

        // Apply pagination with sane defaults and bounds
        int pageNum = request.getPage() == null || request.getPage() <= 0 ? 1 : request.getPage();
        int pageSize = request.getLimit() == null ? 20 : Math.min(Math.max(request.getLimit(), 1), 100);
        Page<SysUser> page = new Page<>(pageNum, pageSize);
        Page<SysUser> result = sysUserMapper.selectPage(page, wrapper);
        ListAdminsResponseDTO resp = new ListAdminsResponseDTO();
        // Map user records to admin response items, enriched with `sys_admin` fields
        List<SysAdmin> items = result.getRecords().stream().map(u -> {
            SysAdmin ext = sysAdminMapper.selectByUserId(u.getUserId());
            if (ext == null) {
                ext = new SysAdmin();
                ext.setUserId(u.getUserId());
            }
            ext.setId(String.valueOf(u.getUserId()));
            ext.setEmail(u.getEmail());
            ext.setName(u.getUserName());
            ext.setInvitedAt(u.getInvitedAt());
            ext.setLastLoginAt(u.getLastLoginAt());
            ext.setRegisteredAt(u.getRegisteredAt());

            transStatus(u, ext);
            return ext;
        }).collect(Collectors.toList());
        resp.setAdmins(items);

        // Build pagination metadata for response
        resp.setPagination(buildPagination((int) result.getCurrent(), (int) result.getSize(), result.getTotal(), result.getPages()));
        return resp;
    }

    private void transStatus(SysUser u, SysAdmin ext) {
        if (UserStatus.ACTIVE.code().equals(u.getStatus())) {
            ext.setStatus("ACTIVE");
        } else if (UserStatus.INACTIVE.code().equals(u.getStatus())) {
            ext.setStatus("INACTIVE");
        } else {
            ext.setStatus("INACTIVE");
        }
        // Map registrationStatus
        if (u.getRegistrationStatus() != null) {
            if (RegistrationStatus.Pending.code().equals(u.getRegistrationStatus())) {
                ext.setRegistrationStatus("PENDING");
            } else if (RegistrationStatus.REGISTERED.code().equals(u.getRegistrationStatus())) {
                ext.setRegistrationStatus("REGISTERED");
            } else if (RegistrationStatus.EXPIRED.code().equals(u.getRegistrationStatus())) {
                ext.setRegistrationStatus("EXPIRED");
            }
        }
    }

    @Override
    public SysAdmin getAdminDetail(String id) {
        if (StringUtils.isEmpty(id)) {
            throw new BusinessException("Invalid admin id", CommonError.BAD_REQUEST.getCode());
        }
        Long userId;
        try {
            userId = Long.parseLong(id);
        } catch (NumberFormatException e) {
            throw new BusinessException("Invalid admin id", CommonError.BAD_REQUEST.getCode());
        }

        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("Admin not found", CommonError.NOT_FOUND.getCode());
        }

        // Ensure user is ACTIVE
        if (!UserStatus.ACTIVE.code().equals(user.getStatus())) {
            throw new BusinessException("Account is not active", CommonError.FORBIDDEN.getCode());
        }

        // Ensure user role is ADMIN
        SysUserRole mapping = sysUserRoleMapper.selectByUserId(userId);
        if (mapping == null) {
            throw new BusinessException("Admin not found", CommonError.NOT_FOUND.getCode());
        }
        SysRole role = sysRoleMapper.selectById(mapping.getRoleId());
        if (role == null || !UserRole.ADMIN.code().equals(role.getRoleKey())) {
            throw new BusinessException("Admin not found", CommonError.NOT_FOUND.getCode());
        }

        SysAdmin admin = sysAdminMapper.selectByUserId(userId);
        if (admin == null) {
            admin = Convert.convertObject(user, SysAdmin.class);
            log.info("[GetAdminDetail] No sys_admin found for userId={}, creating empty admin record", admin);
            admin.setUserId(userId);
        }

        // Assemble response fields
        admin.setId(String.valueOf(userId));
        admin.setInvitedAt(user.getInvitedAt());
        admin.setLastLoginAt(user.getLastLoginAt());
        admin.setRegisteredAt(user.getRegisteredAt());
        admin.setEmail(user.getEmail());
        admin.setName(user.getUserName());

        transStatus(user, admin);

        // Placeholder empty lists for courses and recentActivity per API spec
        admin.setCourses(Collections.emptyList());
        admin.setRecentActivity(Collections.emptyList());
        return admin;
    }
    @Override
    @Transactional
    public SysAdmin inviteAdmin(AdminInviteDTO dto) {
        // Determine email: prefer sisLoginId@unimelb.edu.au; fallback to provided email
        String email = null;
        if (dto.getEmail() != null && !dto.getEmail().isEmpty()) {
            email = dto.getEmail();
        } else if (dto.getSisUserId() != null && !dto.getSisUserId().isEmpty()) {
            email = dto.getSisLoginId() + "@unimelb.edu.au";
        } else {
            throw new BusinessException("Email and login id cannot be both null", CommonError.BAD_REQUEST.getCode());
        }
        // Validate email domain
        if (email == null || !email.toLowerCase().endsWith("@unimelb.edu.au") && !email.toLowerCase().endsWith("@student.unimelb.edu.au")) {
            throw new BusinessException("Invalid email domain (must be @unimelb.edu.au or @student.unimelb.edu.au)", CommonError.BAD_REQUEST.getCode());
        }

        // Check email uniqueness
        SysUser existed = sysUserMapper.selectOne(new QueryWrapper<SysUser>().eq("email", email));
        if (existed != null) {
            throw new BusinessException("Email already exists", HttpStatus.CONFLICT + "");
        }

        // 1) state=2 invited
        SysUser u = new SysUser();
        u.setUserName(dto.getName() != null ? dto.getName() : dto.getEmail());
        u.setEmail(email);
        u.setStatus(UserStatus.INACTIVE.code());
        u.setRegistrationStatus(RegistrationStatus.Pending.code());
        u.setPassword("123456");
        Date invitedAt = new Date();
        u.setInvitedAt(invitedAt);
        log.info("[InviteAdmin] Before insert sys_user, userId={}, email={}", u.getUserId(), email);
        sysUserMapper.insert(u);
        log.info("[InviteAdmin] After insert sys_user, generated userId={}", u.getUserId());

        SysRole adminRole = sysRoleMapper.selectOne(new QueryWrapper<SysRole>().eq("role_key", UserRole.ADMIN.code()));
        Long roleId = adminRole.getRoleId();
        log.info("[InviteAdmin] Bind ROLE_ADMIN roleId={} to userId={}", roleId, u.getUserId());
        sysUserRoleMapper.insert(new SysUserRole(u.getUserId(), roleId));

        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        SysAdmin admin = new SysAdmin();
        admin.setUserId(u.getUserId());
        admin.setDepartment(dto.getDepartment());
        admin.setToken(token);
        log.info("[InviteAdmin] Insert sys_admin for userId={}, department={}", u.getUserId(), dto.getDepartment());
        sysAdminMapper.insert(admin);

        admin.setId(String.valueOf(u.getUserId()));
        admin.setEmail(u.getEmail());
        admin.setName(u.getUserName());

        admin.setStatus("INVITED");
        Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        cal.setTime(invitedAt);

        cal.add(Calendar.DAY_OF_MONTH, 7);
        admin.setInvitationExpiresAt(cal.getTime());

        return admin;
    }

    @Override
    @Transactional
    public List<SysAdmin> inviteAdminsFromCsv(List<AdminInviteDTO> admins) {
        List<SysAdmin> created = new ArrayList<>();
        for (AdminInviteDTO dto : admins) {
            created.add(inviteAdmin(dto));
        }
        return created;
    }

    private PaginationDTO buildPagination(Integer currentPage, Integer itemsPerPage, Long totalItems, Long totalPages) {
        PaginationDTO p = new PaginationDTO();
        p.setCurrentPage(currentPage);
        p.setItemsPerPage(itemsPerPage);
        p.setTotalItems(totalItems);
        p.setTotalPages(totalPages != null ? totalPages.intValue() : 0);
        p.setHasNext(totalPages != null && currentPage != null && currentPage < totalPages);
        p.setHasPrev(currentPage != null && currentPage > 1);
        return p;
    }

    @Override
    @Transactional
    public UpdateAdminStatusResponseDTO updateAdminStatus(String id, String status, String reason) {
        if (StringUtils.isEmpty(id)) {
            throw new BusinessException("Invalid id", CommonError.BAD_REQUEST.getCode());
        }
        Long userId;
        try {
            userId = Long.parseLong(id);
        } catch (NumberFormatException e) {
            throw new BusinessException("Invalid id", CommonError.BAD_REQUEST.getCode());
        }

        // User must exist
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("Admin not found", CommonError.NOT_FOUND.getCode());
        }

        // Ensure role is ADMIN
        SysUserRole mapping = sysUserRoleMapper.selectByUserId(userId);
        if (mapping == null) {
            throw new BusinessException("Admin not found", CommonError.NOT_FOUND.getCode());
        }
        SysRole role = sysRoleMapper.selectById(mapping.getRoleId());
        if (role == null || !UserRole.ADMIN.code().equals(role.getRoleKey())) {
            throw new BusinessException("Admin not found", CommonError.NOT_FOUND.getCode());
        }

        // Force activate if currently inactive (other values stay as-is)
        if ("ACTIVE".equalsIgnoreCase(status)) {
            user.setStatus(UserStatus.ACTIVE.code());
        }else if ("INACTIVE".equalsIgnoreCase(status)) {
            user.setStatus(UserStatus.INACTIVE.code());
        } else {
            throw new BusinessException("This status is not allowed.", CommonError.BAD_REQUEST.getCode());
        }
        sysUserMapper.updateById(user);

        UpdateAdminStatusResponseDTO resp = new UpdateAdminStatusResponseDTO();
        resp.setId(id);
        resp.setStatus(status.toUpperCase());
        resp.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC).toString());
        return resp;
    }

    @Override
    public CheckEmailResponseDTO checkEmail(String email) {
        CheckEmailResponseDTO resp = new CheckEmailResponseDTO();
        resp.setEmail(email);
        boolean valid = email != null && email.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
        resp.setValid(valid);
        boolean exists = false;
        if (valid) {
            SysUser existed = sysUserMapper.selectOne(new QueryWrapper<SysUser>().eq("email", email));
            exists = existed != null;
        }
        resp.setExists(exists);
        return resp;
    }

    @Override
    @Transactional
    public RevokeAdminAccessResponseDTO revokeAdmin(String id, String reason, String transferCoursesTo) {
        if (StringUtils.isEmpty(id)) {
            throw new BusinessException("Invalid admin id", CommonError.BAD_REQUEST.getCode());
        }
        Long userId;
        try {
            userId = Long.parseLong(id);
        } catch (NumberFormatException e) {
            throw new BusinessException("Invalid admin id", CommonError.BAD_REQUEST.getCode());
        }

        // Ensure user exists and is ADMIN
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("Admin not found", CommonError.NOT_FOUND.getCode());
        }
        SysUserRole mapping = sysUserRoleMapper.selectByUserId(userId);
        if (mapping == null) {
            throw new BusinessException("Admin not found", CommonError.NOT_FOUND.getCode());
        }
        SysRole role = sysRoleMapper.selectById(mapping.getRoleId());
        if (role == null || !UserRole.ADMIN.code().equals(role.getRoleKey())) {
            throw new BusinessException("Admin not found", CommonError.NOT_FOUND.getCode());
        }

        // Logical revoke: set status to INACTIVE
        user.setStatus(UserStatus.INACTIVE.code());
        sysUserMapper.updateById(user);

        // Placeholder: transfer courses to another admin if provided
        int transferred = 0;
        if (StringUtils.isNotEmpty(transferCoursesTo)) {
            // TODO: implement course transfer logic when course model is ready
            transferred = 0;
        }

        RevokeAdminAccessResponseDTO resp = new RevokeAdminAccessResponseDTO();
        resp.setRevokedAt(OffsetDateTime.now(ZoneOffset.UTC).toString());
        resp.setCoursesTransferred(transferred);
        return resp;
    }

    public SuperAdminCourseListResponseDTO listCourses(SuperAdminCourseQueryRequestDTO req) {
        String normalizedSemester = normalizeSemester(req.getSemester());
        IPage<Subject> pageResult = subjectService.getCourses(
                req.getPage(),
                Math.min(Math.max(req.getLimit(), 1), 100),
                req.getYear(),
                normalizedSemester,
                req.getSearch(),
                req.getAdminId(),
                req.getStatus()
        );

        List<SuperAdminCourseItemDTO> items = pageResult.getRecords().stream()
                .map(this::toItem)
                .collect(Collectors.toList());

        PaginationDTO pagination = new PaginationDTO();
        pagination.setCurrentPage((int) pageResult.getCurrent());
        int totalPages = (int) ((pageResult.getTotal() + pageResult.getSize() - 1) / pageResult.getSize());
        pagination.setTotalPages(totalPages);
        pagination.setTotalItems(pageResult.getTotal());
        pagination.setItemsPerPage((int) pageResult.getSize());
        pagination.setHasNext(pageResult.getCurrent() < totalPages);
        pagination.setHasPrev(pageResult.getCurrent() > 1);

        SuperAdminCourseListResponseDTO response = new SuperAdminCourseListResponseDTO();
        response.setCourses(items);
        response.setPagination(pagination);
        return response;
    }

    public SuperAdminCourseDetailResponseDTO getCourseDetail(Long id) {
        Subject s = subjectService.getSubjectById(id);
        SuperAdminCourseDetailResponseDTO dto = new SuperAdminCourseDetailResponseDTO();
        dto.setId(s.getSubjectId());
        dto.setCode(s.getSubjectCode());
        dto.setName(s.getSubjectName());
        dto.setDescription(s.getDescription());
        dto.setSemester(prettySemester(s.getSemester()));
        dto.setYear(s.getAcademicYear());
        dto.setDepartment(null);
        dto.setVenue(null);
        dto.setStatus(s.getStatus() != null ? s.getStatus().toUpperCase() : (Boolean.TRUE.equals(s.getIsActive()) ? "ACTIVE" : "INACTIVE"));
        dto.setCreatedAt(s.getCreateTime());
        dto.setUpdatedAt(s.getUpdateTime());
        if (s.getAdminUserId() != null) {
            dto.setAdminId(s.getAdminUserId());
            try {
                SysUser admin = sysUserMapper.selectById(s.getAdminUserId());
                if (admin != null) {
                    dto.setAdminName(admin.getUserName());
                    dto.setAdminEmail(admin.getEmail());
                }
            } catch (Exception ignored) {}
        }
        dto.setAssignments(Collections.emptyList());
        dto.setAssignmentsCount(null);
        dto.setStudentsCount(null);
        return dto;
    }

    private SuperAdminCourseItemDTO toItem(Subject s) {
        SuperAdminCourseItemDTO dto = new SuperAdminCourseItemDTO();
        dto.setId(s.getSubjectId());
        dto.setCode(s.getSubjectCode());
        dto.setName(s.getSubjectName());
        dto.setSemester(prettySemester(s.getSemester()));
        dto.setYear(s.getAcademicYear());
        dto.setDepartment(null);
        dto.setVenue(null);
        dto.setStatus(s.getStatus() != null ? s.getStatus().toUpperCase() : (Boolean.TRUE.equals(s.getIsActive()) ? "ACTIVE" : "INACTIVE"));
        dto.setCreatedAt(s.getCreateTime());
        dto.setUpdatedAt(s.getUpdateTime());
        if (s.getAdminUserId() != null) {
            dto.setAdminId(s.getAdminUserId());
            try {
                SysUser admin = sysUserMapper.selectById(s.getAdminUserId());
                if (admin != null) {
                    dto.setAdminName(admin.getUserName());
                    dto.setAdminEmail(admin.getEmail());
                }
            } catch (Exception ignored) {}
        }
        dto.setAssignmentsCount(null);
        dto.setStudentsCount(null);
        return dto;
    }

    private String normalizeSemester(String semester) {
        if (semester == null || semester.isEmpty()) {
            return null;
        }
        String s = semester.trim().toLowerCase();
        if ("semester 1".equals(s) || "sem 1".equals(s) || "s1".equals(s) || "1".equals(s)) {
            return "1";
        }
        if ("semester 2".equals(s) || "sem 2".equals(s) || "s2".equals(s) || "2".equals(s)) {
            return "2";
        }
        if ("summer".equals(s) || "summer term".equals(s)) {
            return "summer";
        }
        return semester; // fallback
    }

    private String prettySemester(String raw) {
        if (raw == null) return null;
        switch (raw) {
            case "1": return "Semester 1";
            case "2": return "Semester 2";
            case "summer": return "Summer Term";
            default: return raw;
        }
    }
}


