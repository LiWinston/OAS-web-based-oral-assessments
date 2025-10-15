package org.swen90017.oas.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.swen90017.oas.dto.profile.AdminCourseSummary;
import org.swen90017.oas.dto.profile.AdminTaskSummary;
import org.swen90017.oas.dto.profile.SessionSummaryDto;
import org.swen90017.oas.dto.profile.SuperAdminMetricsSummary;

@Mapper
public interface ProfileWidgetMapper {

    @Select("SELECT ss.session_id AS sessionId, ss.assignment_id AS assignmentId, a.name AS assignmentName, ss.start_at AS startAt, ss.end_at AS endAt, v.room_name AS venueName " +
            "FROM session_student st " +
            "JOIN slot_sessions ss ON ss.session_id = st.session_id " +
            "LEFT JOIN assignment a ON a.id = ss.assignment_id " +
            "LEFT JOIN venue v ON v.id = ss.venue_id " +
            "WHERE (" +
            "  (st.type = 'INDIVIDUAL' AND st.subject_id = #{studentId}) " +
            "  OR " +
            "  (st.type IN ('GROUP', 'MIX') AND st.subject_id IN (SELECT sg.group_id FROM sys_student_group sg WHERE sg.user_id = #{studentId})) " +
            ") " +
            "AND ss.start_at >= NOW() " +
            "ORDER BY ss.start_at ASC LIMIT 1")
    SessionSummaryDto findStudentNextSession(@Param("studentId") Long studentId);

    @Select("SELECT ss.session_id AS sessionId, ss.assignment_id AS assignmentId, a.name AS assignmentName, ss.start_at AS startAt, ss.end_at AS endAt, v.room_name AS venueName " +
            "FROM session_student st " +
            "JOIN slot_sessions ss ON ss.session_id = st.session_id " +
            "LEFT JOIN assignment a ON a.id = ss.assignment_id " +
            "LEFT JOIN venue v ON v.id = ss.venue_id " +
            "WHERE (" +
            "  (st.type = 'INDIVIDUAL' AND st.subject_id = #{studentId}) " +
            "  OR " +
            "  (st.type IN ('GROUP', 'MIX') AND st.subject_id IN (SELECT sg.group_id FROM sys_student_group sg WHERE sg.user_id = #{studentId})) " +
            ") " +
            "AND ss.start_at < NOW() " +
            "ORDER BY ss.start_at DESC LIMIT #{limit}")
    List<SessionSummaryDto> findStudentRecentSessions(@Param("studentId") Long studentId, @Param("limit") int limit);

    @Select("SELECT ss.session_id AS sessionId, ss.assignment_id AS assignmentId, a.name AS assignmentName, ss.start_at AS startAt, ss.end_at AS endAt, v.room_name AS venueName " +
            "FROM session_examiners se " +
            "JOIN slot_sessions ss ON ss.session_id = se.session_id " +
            "LEFT JOIN assignment a ON a.id = ss.assignment_id " +
            "LEFT JOIN venue v ON v.id = ss.venue_id " +
            "WHERE se.examiner_id = #{examinerId} AND ss.start_at >= NOW() " +
            "ORDER BY ss.start_at ASC LIMIT 1")
    SessionSummaryDto findExaminerNextSession(@Param("examinerId") Long examinerId);

    @Select("SELECT ss.session_id AS sessionId, ss.assignment_id AS assignmentId, a.name AS assignmentName, ss.start_at AS startAt, ss.end_at AS endAt, v.room_name AS venueName " +
            "FROM session_examiners se " +
            "JOIN slot_sessions ss ON ss.session_id = se.session_id " +
            "LEFT JOIN assignment a ON a.id = ss.assignment_id " +
            "LEFT JOIN venue v ON v.id = ss.venue_id " +
            "WHERE se.examiner_id = #{examinerId} AND ss.start_at < NOW() " +
            "ORDER BY ss.start_at DESC LIMIT #{limit}")
    List<SessionSummaryDto> findExaminerRecentSessions(@Param("examinerId") Long examinerId, @Param("limit") int limit);

    @Select("SELECT s.subject_id AS subjectId, s.subject_code AS subjectCode, s.subject_name AS subjectName, s.status AS status, " +
            "COUNT(DISTINCT a.id) AS assignmentCount, " +
            "COALESCE(SUM(CASE WHEN ss.is_staffed = 0 OR ss.is_staffed IS NULL THEN 1 ELSE 0 END), 0) AS unstaffedSessions " +
            "FROM subject s " +
            "LEFT JOIN assignment a ON a.subject_id = s.subject_id " +
            "LEFT JOIN slot_sessions ss ON ss.assignment_id = a.id " +
            "WHERE s.admin_user_id = #{adminUserId} " +
            "GROUP BY s.subject_id, s.subject_code, s.subject_name, s.status, s.update_time, s.create_time " +
            "ORDER BY COALESCE(s.update_time, s.create_time) DESC " +
            "LIMIT #{limit}")
    List<AdminCourseSummary> findAdminCourseSummaries(@Param("adminUserId") Long adminUserId, @Param("limit") int limit);

    @Select("SELECT " +
            "  (SELECT COUNT(*) FROM slot_sessions ss " +
            "     JOIN assignment a ON a.id = ss.assignment_id " +
            "     JOIN subject s ON s.subject_id = a.subject_id " +
            "     WHERE s.admin_user_id = #{adminUserId} AND ss.start_at >= NOW() AND (ss.is_staffed = 0 OR ss.is_staffed IS NULL)) AS unstaffedSessions, " +
            "  (SELECT COUNT(*) FROM slot_sessions ss " +
            "     JOIN assignment a ON a.id = ss.assignment_id " +
            "     JOIN subject s ON s.subject_id = a.subject_id " +
            "     WHERE s.admin_user_id = #{adminUserId} AND ss.start_at >= NOW() AND ss.booked_subject_id IS NULL) AS openSessions, " +
            "  (SELECT COUNT(*) FROM assignment a " +
            "     JOIN subject s ON s.subject_id = a.subject_id " +
            "     WHERE s.admin_user_id = #{adminUserId} AND a.status IN ('PENDING','IN_PROGRESS')) AS assignmentsPending")
    AdminTaskSummary findAdminTaskSummary(@Param("adminUserId") Long adminUserId);

    @Select("SELECT " +
            "  (SELECT COUNT(*) FROM sys_user u " +
            "     JOIN sys_user_role ur ON ur.user_id = u.user_id " +
            "     JOIN sys_role r ON r.role_id = ur.role_id " +
            "     WHERE r.role_key = 'ROLE_ADMIN' AND u.registration_status = '0') AS pendingAdminApprovals, " +
            "  (SELECT COUNT(*) FROM subject WHERE is_active = 1) AS activeCourses, " +
            "  (SELECT COUNT(*) FROM sys_user WHERE create_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS newUsers7d, " +
            "  (SELECT COUNT(*) FROM sys_user) AS totalUsers")
    SuperAdminMetricsSummary findSuperAdminMetrics();
}
