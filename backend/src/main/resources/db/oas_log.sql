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
    `operator_type` int(1) DEFAULT '0' COMMENT 'Operator type (0=Other,1=Admin,2=Examiner,3=Student)',
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
CREATE TABLE sys_user_role (
                               user_id BIGINT,
                               role_id BIGINT,
                               PRIMARY KEY(user_id, role_id)
);

CREATE TABLE sys_student (
                             user_id BIGINT PRIMARY KEY,
                             token VARCHAR(255),
                             student_number VARCHAR(50) UNIQUE,
                             FOREIGN KEY (user_id) REFERENCES sys_user(user_id) ON DELETE CASCADE
);
CREATE TABLE sys_group (
                           group_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                           group_name VARCHAR(100) NOT NULL,
                           canvas_group_id VARCHAR(50) UNIQUE,
                           create_time DATETIME,
                           creator BIGINT
);
CREATE TABLE sys_student_group (
                                   user_id BIGINT NOT NULL,
                                   group_id BIGINT NOT NULL,
                                   PRIMARY KEY (user_id, group_id),
                                   FOREIGN KEY (user_id) REFERENCES sys_user(user_id) ON DELETE CASCADE,
                                   FOREIGN KEY (group_id) REFERENCES sys_group(group_id) ON DELETE CASCADE
);
