-- ----------------------------
-- Operation log table structure
-- ----------------------------
DROP TABLE IF EXISTS `sys_oper_log`;
CREATE TABLE `sys_oper_log` (
                                `oper_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'Log ID',
    `title` varchar(50) DEFAULT '' COMMENT 'Module title',
    `business_type` int(2) DEFAULT '0' COMMENT 'Business type (0=Other,1=Insert,2=Update,3=Delete,4=Query,5=Grant,6=Export,7=Import,8=Booking,9=Cancel Booking,10=Assessment,11=Feedback)',
    `method` varchar(100) DEFAULT '' COMMENT 'Method name',
    `request_method` varchar(10) DEFAULT '' COMMENT 'Request method',
    `operator_type` int(1) DEFAULT '0' COMMENT 'Operator type (0=Other,1=Admin,2=Examiner,3=Student,4=Super Admin)',
    `oper_name` varchar(50) DEFAULT '' COMMENT 'Operator name',
    `oper_role` varchar(50) DEFAULT '' COMMENT 'Operator role',
    `oper_url` varchar(255) DEFAULT '' COMMENT 'Request URL',
    `oper_ip` varchar(128) DEFAULT '' COMMENT 'Operator IP',
    `oper_location` varchar(255) DEFAULT '' COMMENT 'Operation location',
    `oper_param` varchar(2000) DEFAULT '' COMMENT 'Request parameters',
    `json_result` varchar(2000) DEFAULT '' COMMENT 'Response result',
    `status` int(1) DEFAULT '0' COMMENT 'Status (0=Normal,1=Exception)',
    `error_msg` varchar(2000) DEFAULT '' COMMENT 'Error message',
    `oper_time` datetime DEFAULT NULL COMMENT 'Operation time',
    `cost_time` bigint(20) DEFAULT '0' COMMENT 'Execution time (ms)',
    `trace_id` varchar(64) DEFAULT '' COMMENT 'Trace ID for request tracking',
    PRIMARY KEY (`oper_id`),
    KEY `idx_sys_oper_log_bt` (`business_type`),
    KEY `idx_sys_oper_log_s` (`status`),
    KEY `idx_sys_oper_log_ot` (`oper_time`),
    KEY `idx_sys_oper_log_tid` (`trace_id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='Operation log table';
DROP TABLE IF EXISTS `sys_refresh_token`;
CREATE TABLE sys_refresh_token (
                                   id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                   user_id BIGINT NOT NULL,
                                   token VARCHAR(255) NOT NULL,
                                   expiry_time DATETIME NOT NULL,
                                   issued_time DATETIME NOT NULL,
                                   revoked BOOLEAN DEFAULT FALSE,
                                   UNIQUE INDEX idx_token (token),
                                   INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='refresh_token';

-- user table
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE sys_user (
                          user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                          user_name VARCHAR(50) UNIQUE NOT NULL,
                          password VARCHAR(100) NOT NULL,
                          status CHAR(1) DEFAULT '0' COMMENT '0 normal 1 ban',
                          create_time DATETIME,
                          creator BIGINT,
                          update_time DATETIME,
                          updater BIGINT
);

-- role table
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE sys_role (
                          role_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                          role_name VARCHAR(50) UNIQUE NOT NULL,
                          role_key VARCHAR(50) UNIQUE NOT NULL,  -- e.g. ROLE_ADMIN
                          create_time DATETIME,
                          creator BIGINT,
                          update_time DATETIME,
                          updater BIGINT
);

-- user-role association table
DROP TABLE IF EXISTS `sys_user_role`;
CREATE TABLE sys_user_role (
                               user_id BIGINT,
                               role_id BIGINT,
                               PRIMARY KEY(user_id, role_id)
);
DROP TABLE IF EXISTS `sys_student`;
CREATE TABLE sys_student (
                             user_id BIGINT PRIMARY KEY,
                             token VARCHAR(255),
                             student_number VARCHAR(50) UNIQUE,
                             sis_user_id VARCHAR(128) UNIQUE,
                             FOREIGN KEY (user_id) REFERENCES sys_user(user_id) ON DELETE CASCADE
);
DROP TABLE IF EXISTS `sys_group`;
CREATE TABLE sys_group (
                           group_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                           group_name VARCHAR(100) NOT NULL,
                           canvas_group_id VARCHAR(50) UNIQUE,
                           create_time DATETIME,
                           creator BIGINT
);
DROP TABLE IF EXISTS `sys_student_group`;

CREATE TABLE sys_student_group (
                                   user_id BIGINT NOT NULL,
                                   group_id BIGINT NOT NULL,
                                   PRIMARY KEY (user_id, group_id),
                                   FOREIGN KEY (user_id) REFERENCES sys_user(user_id) ON DELETE CASCADE,
                                   FOREIGN KEY (group_id) REFERENCES sys_group(group_id) ON DELETE CASCADE
);

-- ----------------------------
-- Epic 4.1 Course Management (Simplified for Frontend Compatibility)
-- ----------------------------

-- Subject/Course table with embedded academic period information
-- Matches frontend expectations: courseName, courseCode, academicYear, semester, etc.
DROP TABLE IF EXISTS `subject`;
CREATE TABLE `subject` (
    `subject_id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `subject_code` VARCHAR(20) NOT NULL COMMENT 'Subject code (e.g., SWEN90017, COMP90082)',
    `subject_name` VARCHAR(200) NOT NULL COMMENT 'Subject full name',
    `description` TEXT COMMENT 'Subject description',
    `academic_year` INT NOT NULL COMMENT 'Academic year (e.g., 2024, 2025)',
    `semester` VARCHAR(20) NOT NULL COMMENT 'Semester (e.g., "1", "2", "summer")',
    `admin_user_id` BIGINT NOT NULL COMMENT 'Administrator user ID (logical reference)',
    `is_active` TINYINT(1) DEFAULT 1 COMMENT '1=active, 0=inactive',
    `status` VARCHAR(20) DEFAULT 'active' COMMENT 'Status: active, archived, etc.',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `creator` BIGINT COMMENT 'Creator user ID (logical reference)',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updater` BIGINT COMMENT 'Updater user ID (logical reference)',
    UNIQUE KEY `uk_subject_year_semester` (`subject_code`, `academic_year`, `semester`),
    KEY `idx_subject_admin` (`admin_user_id`),
    KEY `idx_subject_active` (`is_active`),
    KEY `idx_subject_code` (`subject_code`),
    KEY `idx_subject_year` (`academic_year`),
    KEY `idx_subject_semester` (`semester`),
    KEY `idx_subject_status` (`status`)
);

DROP TABLE IF EXISTS assignment;
CREATE TABLE assignment (
                            id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Primary key ID',
                            subjectId BIGINT NOT NULL COMMENT 'Subject ID, foreign key',
                            name VARCHAR(255) NOT NULL COMMENT 'Assignment name',
                            description TEXT COMMENT 'Assignment description',
                            type VARCHAR(50) NOT NULL COMMENT 'Assignment type',
                            start_date DATETIME NOT NULL COMMENT 'Start date',
                            end_date DATETIME NOT NULL COMMENT 'End date',
                            weight DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Weight percentage',
                            progress DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Progress percentage',
                            status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'Assignment status',
                            rubric_meta_info TEXT COMMENT 'Rubric meta information in JSON format: {name, description, totalPoints}',
                            rubrics_info TEXT COMMENT 'Rubric detailed information in JSON format: {description, weight, scaleType, performanceLevels}',
                            creator BIGINT NOT NULL COMMENT 'Creator user ID',
                            updater BIGINT COMMENT 'Updater user ID',
                            create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
                            update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Assignment table';
