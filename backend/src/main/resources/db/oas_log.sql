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