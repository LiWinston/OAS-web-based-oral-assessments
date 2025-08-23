package org.swen90017.oas.service;

import org.swen90017.oas.dto.request.ListAdminsRequestDTO;
import org.swen90017.oas.dto.request.SuperAdminCourseQueryRequestDTO;
import org.swen90017.oas.dto.response.*;
import org.swen90017.oas.dto.request.AdminInviteDTO;
import org.swen90017.oas.entity.SysAdmin;

import java.util.List;

public interface SuperAdminService {
    /**
     * List administrator users with pagination, sorting and optional filtering.
     *
     * <p>Supported filters may include name/email keywords and status. Sorting is
     * controlled via the request payload (e.g., sortBy/sortOrder). Pagination is
     * specified by page and limit.
     *
     * @param request request payload that contains filters, sort options and pagination
     * @return response DTO carrying the list of admins and pagination metadata
     */
    ListAdminsResponseDTO listAdmins(ListAdminsRequestDTO request);

    /**
     * Invite a single course administrator (SUPER_ADMIN only)
     *
     * @param admin Admin info to invite
     * @return Created admin entity with invitation token
     */
    SysAdmin inviteAdmin(AdminInviteDTO admin);

    /**
     * Get admin detail (aggregate from sys_user and sys_admin)
     *
     * @param id User id (string)
     * @return Admin detail (courses and recentActivity are placeholders now)
     */
    SysAdmin getAdminDetail(String id);

    /**
     * Update admin status (SUPER_ADMIN only)
     * @param id User id (string)
     * @param status Target status (ACTIVE/INACTIVE)
     * @param reason Optional reason
     */
    UpdateAdminStatusResponseDTO updateAdminStatus(String id, String status, String reason);

    /**
     * Check email existence and validate format
     */
    CheckEmailResponseDTO checkEmail(String email);

    /**
     * Revoke admin access (logical delete: set status to INACTIVE) and optionally transfer courses (placeholder)
     */
    RevokeAdminAccessResponseDTO revokeAdmin(String id, String reason, String transferCoursesTo);

    /**
     * Invite admins from CSV (email built from SIS Login ID when provided)
     */
    List<SysAdmin> inviteAdminsFromCsv(List<AdminInviteDTO> admins);


    SuperAdminCourseListResponseDTO listCourses(SuperAdminCourseQueryRequestDTO req);

    SuperAdminCourseDetailResponseDTO getCourseDetail(Long id);
}


