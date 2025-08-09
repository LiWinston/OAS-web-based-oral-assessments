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
-- Academic structure tables for Epic 4.1
-- ----------------------------

-- Academic Year table structure
DROP TABLE IF EXISTS `academic_year`;
CREATE TABLE `academic_year` (
    `year_id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `year_value` VARCHAR(10) NOT NULL COMMENT 'Academic year (e.g., 2024, 2025)',
    `start_date` DATE NOT NULL COMMENT 'Academic year start date',
    `end_date` DATE NOT NULL COMMENT 'Academic year end date',
    `is_active` TINYINT(1) DEFAULT 1 COMMENT '1 active, 0 inactive',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `creator` BIGINT COMMENT 'Creator user ID (logical reference)',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updater` BIGINT COMMENT 'Updater user ID (logical reference)',
    UNIQUE KEY `uk_year_value` (`year_value`),
    KEY `idx_year_active` (`is_active`),
    KEY `idx_year_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Academic year table';

-- Semester table structure
DROP TABLE IF EXISTS `semester`;
CREATE TABLE `semester` (
    `semester_id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `academic_year_id` BIGINT NOT NULL COMMENT 'Academic year ID (logical reference)',
    `semester_name` VARCHAR(50) NOT NULL COMMENT 'Semester name (e.g., Semester 1, Semester 2, Summer)',
    `semester_code` VARCHAR(10) NOT NULL COMMENT 'Semester code (e.g., S1, S2, SU)',
    `start_date` DATE NOT NULL COMMENT 'Semester start date',
    `end_date` DATE NOT NULL COMMENT 'Semester end date',
    `is_active` TINYINT(1) DEFAULT 1 COMMENT '1 active, 0 inactive',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `creator` BIGINT COMMENT 'Creator user ID (logical reference)',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updater` BIGINT COMMENT 'Updater user ID (logical reference)',
    UNIQUE KEY `uk_year_semester` (`academic_year_id`, `semester_code`),
    KEY `idx_semester_active` (`is_active`),
    KEY `idx_semester_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Semester table';

-- Subject table structure
DROP TABLE IF EXISTS `subject`;
CREATE TABLE `subject` (
    `subject_id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `semester_id` BIGINT NOT NULL COMMENT 'Semester ID (logical reference)',
    `subject_code` VARCHAR(20) NOT NULL COMMENT 'Subject code (e.g., SWEN90017)',
    `subject_name` VARCHAR(200) NOT NULL COMMENT 'Subject name',
    `description` TEXT COMMENT 'Subject description',
    `admin_user_id` BIGINT NOT NULL COMMENT 'Administrator user ID (logical reference)',
    `is_active` TINYINT(1) DEFAULT 1 COMMENT '1 active, 0 inactive',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `creator` BIGINT COMMENT 'Creator user ID (logical reference)',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updater` BIGINT COMMENT 'Updater user ID (logical reference)',
    UNIQUE KEY `uk_semester_subject_code` (`semester_id`, `subject_code`),
    KEY `idx_subject_admin` (`admin_user_id`),
    KEY `idx_subject_active` (`is_active`),
    KEY `idx_subject_code` (`subject_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Subject table';

-- Academic year table
DROP TABLE IF EXISTS `academic_year`;
CREATE TABLE academic_year (
    year_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    year_value INT NOT NULL COMMENT 'Academic year value (e.g., 2024)',
    year_name VARCHAR(50) NOT NULL COMMENT 'Academic year display name (e.g., "2024 Academic Year")',
    start_date DATE NOT NULL COMMENT 'Academic year start date',
    end_date DATE NOT NULL COMMENT 'Academic year end date',
    is_active CHAR(1) DEFAULT '1' COMMENT '1=active, 0=inactive',
    status CHAR(1) DEFAULT '0' COMMENT '0=normal, 1=deleted',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    creator BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updater BIGINT,
    INDEX idx_year_value (year_value),
    INDEX idx_year_active (is_active),
    INDEX idx_year_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Academic year table';

-- Semester table
DROP TABLE IF EXISTS `semester`;
CREATE TABLE semester (
    semester_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    academic_year_id BIGINT NOT NULL COMMENT 'Reference to academic_year.year_id',
    semester_code VARCHAR(20) NOT NULL COMMENT 'Semester code (e.g., S1, S2, SUMMER)',
    semester_name VARCHAR(50) NOT NULL COMMENT 'Semester display name (e.g., "Semester 1", "Summer Term")',
    start_date DATE NOT NULL COMMENT 'Semester start date',
    end_date DATE NOT NULL COMMENT 'Semester end date',
    is_active CHAR(1) DEFAULT '1' COMMENT '1=active, 0=inactive',
    status CHAR(1) DEFAULT '0' COMMENT '0=normal, 1=deleted',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    creator BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updater BIGINT,
    INDEX idx_semester_year (academic_year_id),
    INDEX idx_semester_code (semester_code),
    INDEX idx_semester_active (is_active),
    INDEX idx_semester_status (status),
    UNIQUE KEY uk_year_semester (academic_year_id, semester_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Semester table';

-- Subject table
DROP TABLE IF EXISTS `subject`;
CREATE TABLE subject (
    subject_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    subject_code VARCHAR(20) NOT NULL COMMENT 'Subject code (e.g., SWEN90017)',
    subject_name VARCHAR(100) NOT NULL COMMENT 'Subject full name',
    description TEXT COMMENT 'Subject description',
    credit_points INT DEFAULT 0 COMMENT 'Subject credit points',
    is_active CHAR(1) DEFAULT '1' COMMENT '1=active, 0=inactive',
    status CHAR(1) DEFAULT '0' COMMENT '0=normal, 1=deleted',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    creator BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updater BIGINT,
    INDEX idx_subject_code (subject_code),
    INDEX idx_subject_active (is_active),
    INDEX idx_subject_status (status),
    UNIQUE KEY uk_subject_code (subject_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Subject table';

-- Subject offering table (many-to-many relationship between subject and semester)
DROP TABLE IF EXISTS `subject_offering`;
CREATE TABLE subject_offering (
    offering_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    subject_id BIGINT NOT NULL COMMENT 'Reference to subject.subject_id',
    semester_id BIGINT NOT NULL COMMENT 'Reference to semester.semester_id',
    coordinator_id BIGINT COMMENT 'Reference to sys_user.user_id (subject coordinator)',
    max_students INT DEFAULT 0 COMMENT 'Maximum number of students for this offering',
    current_enrollment INT DEFAULT 0 COMMENT 'Current number of enrolled students',
    is_active CHAR(1) DEFAULT '1' COMMENT '1=active, 0=inactive',
    status CHAR(1) DEFAULT '0' COMMENT '0=normal, 1=deleted',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    creator BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updater BIGINT,
    INDEX idx_offering_subject (subject_id),
    INDEX idx_offering_semester (semester_id),
    INDEX idx_offering_coordinator (coordinator_id),
    INDEX idx_offering_active (is_active),
    INDEX idx_offering_status (status),
    UNIQUE KEY uk_subject_semester (subject_id, semester_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Subject offering table';
