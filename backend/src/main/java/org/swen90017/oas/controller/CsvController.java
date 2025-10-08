package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.CSVImportDTO;
import org.swen90017.oas.dto.request.ExaminerCSVRequestDTO;
import org.swen90017.oas.dto.request.GroupCSVRequestDTO;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.dto.response.GroupPreviewCSVResponseDTO;
import org.swen90017.oas.dto.response.PreviewCSVResponseDTO;
import org.swen90017.oas.entity.SysExaminer;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.service.CsvService;
import org.swen90017.oas.service.CsvHistoryService;
import org.swen90017.oas.service.EmailService;
import org.swen90017.oas.service.GroupService;
import org.swen90017.oas.service.ExaminerService;
import org.swen90017.oas.service.StudentService;
import org.swen90017.oas.utils.TransactionUtil;
import org.swen90017.oas.utils.SecurityUtils;
import org.swen90017.oas.entity.CsvImportHistory;
import org.swen90017.oas.entity.LoginUser;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/csv")
public class CsvController {
    @Autowired
    private CsvService csvService;
    @Autowired
    private CsvHistoryService csvHistoryService;
    @Autowired
    private StudentService studentService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private GroupService groupService;
    @Autowired
    private ExaminerService examinerService;

    @Operation(summary = "Preview CSV", description = "Preview CSV content for student/group before importing")
    @PostMapping("/preview")
    public Result<?> previewCsv(@RequestParam("file") MultipartFile file,
                           @RequestParam("type") String type) throws IOException {
        List<?> csvData = csvService.importCsv(file.getInputStream(), type);
        if (csvData == null || csvData.isEmpty()) {
            return Result.error(BusinessError.CSV_READ_FAILED);
        }

        if ("student".equalsIgnoreCase(type)) {
            return previewStudentCsv((List<StudentCSVRequestDTO>) csvData);
        } else if ("group".equalsIgnoreCase(type) || "mix".equalsIgnoreCase(type)) {
            return previewGroupCsv((List<GroupCSVRequestDTO>) csvData);
        } else if ("examiner".equalsIgnoreCase(type)) {
            return previewExaminerCsv((List<ExaminerCSVRequestDTO>) csvData);
        } else {
            return Result.error(BusinessError.INVALID_CSV_TYPE);
        }
    }

    @Operation(summary = "Import CSV", description = "Import CSV data for student/group and send activation emails")
    @PostMapping("/import")
    public Result<?> importCsv(@RequestParam("file") MultipartFile file,
                          @ModelAttribute CSVImportDTO dto) throws IOException {
        // Cache file bytes to allow multiple reads
        byte[] fileBytes = file.getBytes();
        
        // Parse CSV data first
        List<?> csvData = csvService.importCsv(new ByteArrayInputStream(fileBytes), dto.getType());
        if (csvData == null || csvData.isEmpty()) {
            return Result.error(BusinessError.CSV_READ_FAILED);
        }

        // Get current user info
        LoginUser loginUser = SecurityUtils.getLoginUser();
        Long importerId = loginUser != null ? loginUser.getUserId() : null;
        String importerUsername = loginUser != null ? loginUser.getUsername() : "unknown";

        // Save CSV file and create history record
        CsvImportHistory history = null;
        try {
            System.out.println("DEBUG: About to save CSV file, type=" + dto.getType() + ", assignmentId=" + dto.getAssignmentId());
            history = csvHistoryService.saveCsvFileFromBytes(fileBytes, file.getOriginalFilename(), 
                    dto.getType(), dto.getAssignmentId(), importerId, importerUsername, csvData.size());
            System.out.println("DEBUG: CSV file saved successfully, history ID=" + (history != null ? history.getId() : "null"));
        } catch (Exception e) {
            // If saving file fails, still continue with import but log error
            System.err.println("ERROR: Failed to save CSV history: " + e.getMessage());
            e.printStackTrace();
        }

        Result<?> result;
        if ("student".equalsIgnoreCase(dto.getType())) {
            result = importStudentCsv((List<StudentCSVRequestDTO>) csvData, dto.getAssignmentId());
        } else if ("group".equalsIgnoreCase(dto.getType()) || "mix".equalsIgnoreCase(dto.getType())) {
            result = importGroupCsv((List<GroupCSVRequestDTO>) csvData, dto.getAssignmentId());
        } else if ("examiner".equalsIgnoreCase(dto.getType())) {
            result = importExaminerCsv((List<ExaminerCSVRequestDTO>) csvData, dto.getAssignmentId());
        } else {
            result = Result.error(BusinessError.INVALID_CSV_TYPE);
        }

        // Update history status
        if (history != null) {
            if ("200".equals(result.getCode())) {
                csvHistoryService.updateHistoryStatus(history.getId(), "success", null);
            } else {
                String errorMessage = result.getData() != null ? result.getData().toString() : "Import failed";
                csvHistoryService.updateHistoryStatus(history.getId(), "failed", errorMessage);
            }
        }

        return result;
    }

    /**
     * Preview student CSV import
     */
    private Result<PreviewCSVResponseDTO> previewStudentCsv(List<StudentCSVRequestDTO> studentDTOs) {
        PreviewCSVResponseDTO previewResponse = studentService.previewStudentImport(studentDTOs);
        return Result.success(previewResponse);
    }

    /**
     * Preview group CSV import
     */
    private Result<GroupPreviewCSVResponseDTO> previewGroupCsv(List<GroupCSVRequestDTO> groupDTOs) {
        GroupPreviewCSVResponseDTO previewResponse = groupService.previewGroupImport(groupDTOs);
        return Result.success(previewResponse);
    }

    /**
     * Preview examiner CSV import
     */
    private Result<PreviewCSVResponseDTO> previewExaminerCsv(List<ExaminerCSVRequestDTO> examinerDTOs) {
        PreviewCSVResponseDTO previewResponse = examinerService.previewExaminerImport(examinerDTOs);
        return Result.success(previewResponse);
    }

    /**
     * Import student CSV
     */
    private Result<List<SysStudent>> importStudentCsv(List<StudentCSVRequestDTO> studentDTOs, Long assignmentId) {
        List<SysStudent> sysStudents = TransactionUtil.doTransactionWithRequired(() -> {
            List<SysStudent> invited = studentService.inviteStudent(studentDTOs, assignmentId);
            String reason = csvService.buildInviteReason(assignmentId);
            // Send activation emails to new users
            emailService.sendActivationEmail(invited, reason);
            
            // Note: student course-join notifications are sent at "Release to Student", not here
            
            return invited;
        });
        return Result.success(sysStudents);
    }

    /**
     * Import group CSV (also handles mix type)
     */
    private Result<List<SysStudent>> importGroupCsv(List<GroupCSVRequestDTO> groupDTOs, Long assignmentId) {
        List<SysStudent> sysStudents = TransactionUtil.doTransactionWithRequired(() -> {
            List<SysStudent> invited = groupService.importGroupData(groupDTOs, assignmentId);
            String reason = csvService.buildInviteReason(assignmentId);
            emailService.sendActivationEmail(invited, reason);
            return invited;
        });
        return Result.success(sysStudents);
    }

    private Result<List<SysExaminer>> importExaminerCsv(List<ExaminerCSVRequestDTO> csvData, Long assignmentId) {
        List<SysExaminer> examiners = TransactionUtil.doTransactionWithRequired(() -> examinerService.inviteExaminer(csvData, assignmentId));
        String reason = csvService.buildInviteReason(assignmentId);
        // Send activation emails to new users
        emailService.sendExaminerActivationEmail(examiners, reason);
        
        // Send course-join notifications to existing registered users
        examinerService.sendCourseJoinNotificationForExistingExaminers(csvData, assignmentId);
        
        return Result.success(examiners);
    }

    
    
}
