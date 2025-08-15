package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import org.swen90017.oas.dto.response.AdminActivityDTO;
import org.swen90017.oas.dto.response.AdminCourseDTO;

import java.util.Date;
import java.util.List;

@Data
@TableName("sys_admin")
public class SysAdmin {
    // ====== DB Fields ======
    @TableId(value = "user_id", type = IdType.INPUT)
    private Long userId;
    private String department;
    @TableField(exist = false)
    private Date invitedAt;     // moved to sys_user.invited_at
    @TableField(exist = false)
    private Date registeredAt;  // moved to sys_user.registered_at
    @TableField(exist = false)
    private Date lastLoginAt;   // moved to sys_user.last_login_at
    private Integer coursesManaged;
    private Integer studentsManaged;
    private Integer assignmentsCreated;

    // ====== Non-table fields: aggregated for response ======
    @TableField(exist = false)
    private String id;      // stringified userId
    @TableField(exist = false)
    private String email;   // from sys_user
    @TableField(exist = false)
    private String name;    // from sys_user.user_name
    @TableField(exist = false)
    private String status;  // mapped from sys_user.status (ACTIVE/INACTIVE)
    @TableField(exist = false)
    private String registrationStatus; // mapped from sys_user.registration_status (INVITED/REGISTERED/EXPIRED)
    @TableField(exist = false)
    private String sisLoginId; // SIS Login ID from CSV (used to build email if provided)

    // Invitation token (persistent field for registration and validation)
    private String token;

    // ====== Non-table field: invitation expiry time (response only) ======
    @TableField(exist = false)
    private Date invitationExpiresAt;

    // ====== Non-table fields: detail view extensions ======
    @TableField(exist = false)
    private List<AdminCourseDTO> courses;
    @TableField(exist = false)
    private List<AdminActivityDTO> recentActivity;
}


