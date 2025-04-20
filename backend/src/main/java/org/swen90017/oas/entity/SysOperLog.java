package org.swen90017.oas.entity;

import java.io.Serializable;
import java.util.Date;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Data;

/**
 * Operation log record table oper_log
 */
@Data
@TableName("sys_oper_log")
public class SysOperLog implements Serializable {
    private static final long serialVersionUID = 1L;

    /** Log ID */
    @TableId(value = "oper_id", type = IdType.AUTO)
    private Long operId;

    /** Module title */
    @TableField("title")
    private String title;

    /** Business type (0=Other, 1=Insert, 2=Update, 3=Delete, etc.) */
    @TableField("business_type")
    private Integer businessType;

    /** Method name */
    @TableField("method")
    private String method;

    /** Request method */
    @TableField("request_method")
    private String requestMethod;

    /** Operator type (0=Other, 1=Admin, 2=Examiner, 3=Student) */
    @TableField("operator_type")
    private Integer operatorType;

    /** Operator name */
    @TableField("oper_name")
    private String operName;

    /** Operator role */
    @TableField("oper_role")
    private String operRole;

    /** Request URL */
    @TableField("oper_url")
    private String operUrl;

    /** IP address */
    @TableField("oper_ip")
    private String operIp;

    /** Operation location */
    @TableField("oper_location")
    private String operLocation;

    /** Request parameters */
    @TableField("oper_param")
    private String operParam;

    /** Response parameters */
    @TableField("json_result")
    private String jsonResult;

    /** Status (0=Success, 1=Failure) */
    @TableField("status")
    private Integer status;

    /** Error message */
    @TableField("error_msg")
    private String errorMsg;

    /** Operation time */
    @TableField("oper_time")
    private Date operTime;

    /** Execution time (ms) */
    @TableField("cost_time")
    private Long costTime;
} 