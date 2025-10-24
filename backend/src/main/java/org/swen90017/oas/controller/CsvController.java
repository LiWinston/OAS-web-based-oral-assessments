package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.CSVImportDTO;
import org.swen90017.oas.dto.request.ExaminerCSVRequestDTO;
import org.swen90017.oas.dto.request.GroupCSVRequestDTO;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.dto.response.GroupGradeExportDTO;
import org.swen90017.oas.dto.response.GroupPreviewCSVResponseDTO;
import org.swen90017.oas.dto.response.IndividualGradeExportDTO;
import org.swen90017.oas.dto.response.PreviewCSVResponseDTO;
import org.swen90017.oas.dto.response.TeacherScoringDetailExportDTO;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.entity.SysExaminer;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.handler.csv.CsvHandler;
import org.swen90017.oas.handler.csv.CsvHandlerFactory;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.service.CsvService;
import org.swen90017.oas.service.CsvHistoryService;
import org.swen90017.oas.service.EmailService;
import org.swen90017.oas.service.GradesExportService;
import org.swen90017.oas.service.GroupService;
import org.swen90017.oas.service.ExaminerService;
import org.swen90017.oas.service.StudentService;
import org.swen90017.oas.utils.TransactionUtil;
import org.swen90017.oas.utils.SecurityUtils;
import org.swen90017.oas.entity.CsvImportHistory;
import org.swen90017.oas.entity.LoginUser;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

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
    @Autowired
    private GradesExportService gradesExportService;
    @Autowired
    private AssignmentMapper assignmentMapper;

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
            history = csvHistoryService.saveCsvFileFromBytes(fileBytes, file.getOriginalFilename(), 
                    dto.getType(), dto.getAssignmentId(), importerId, importerUsername, csvData.size());
        } catch (Exception e) {
            // If saving file fails, still continue with import but log error
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

    @Operation(summary = "Export Grades CSV", description = "Export grades in CSV format for an assignment. For mixed assignments, returns a ZIP file with both individual and group grades.")
    @GetMapping("/export/grades")
    public ResponseEntity<?> exportGrades(
            @RequestParam("assignmentId") Long assignmentId,
            @RequestParam(value = "type", required = false) String type) {
        
        try {
            Assignment assignment = assignmentMapper.selectById(assignmentId);
            if (assignment == null) {
                return ResponseEntity.badRequest().body(Result.error(BusinessError.ASSIGNMENT_NOT_FOUND));
            }

            String assignmentType = assignment.getType();
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String baseFilename = "grades_assignment_" + assignmentId + "_" + timestamp;

            // For mixed assignments, export both individual and group grades as ZIP
            if ("mixed".equalsIgnoreCase(assignmentType) && (type == null || type.isEmpty())) {
                return exportMixedGradesAsZip(assignmentId, baseFilename);
            }

            // For non-mixed or specific type requested
            if ("individual".equalsIgnoreCase(assignmentType) || "individual".equalsIgnoreCase(type)) {
                return exportIndividualGradesCsv(assignmentId, baseFilename + "_individual.csv");
            } else if ("group".equalsIgnoreCase(assignmentType) || "group".equalsIgnoreCase(type)) {
                return exportGroupGradesCsv(assignmentId, baseFilename + "_group.csv");
            }

            return ResponseEntity.badRequest().body(Result.error(String.valueOf(org.swen90017.oas.constant.HttpStatus.BAD_REQUEST), "Invalid assignment type or export type"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Result.error(String.valueOf(org.swen90017.oas.constant.HttpStatus.ERROR), "Failed to export grades: " + e.getMessage()));
        }
    }

    @Operation(summary = "Export Teacher Scoring Details CSV", description = "Export detailed teacher scoring information for an assignment")
    @GetMapping("/export/teacher-scoring-details")
    public ResponseEntity<?> exportTeacherScoringDetails(@RequestParam("assignmentId") Long assignmentId) {
        try {
            Assignment assignment = assignmentMapper.selectById(assignmentId);
            if (assignment == null) {
                return ResponseEntity.badRequest().body(Result.error(BusinessError.ASSIGNMENT_NOT_FOUND));
            }

            List<TeacherScoringDetailExportDTO> data = gradesExportService.exportTeacherScoringDetails(assignmentId);
            
            CsvHandler<Void, TeacherScoringDetailExportDTO> handler = CsvHandlerFactory.getHandler("teacher-scoring-detail");
            String csvContent = handler.export(data);

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = "teacher_scoring_details_assignment_" + assignmentId + "_" + timestamp + ".csv";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csvContent.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Result.error(String.valueOf(org.swen90017.oas.constant.HttpStatus.ERROR), "Failed to export teacher scoring details: " + e.getMessage()));
        }
    }

    /**
     * Export individual grades as CSV
     */
    private ResponseEntity<?> exportIndividualGradesCsv(Long assignmentId, String filename) {
        List<IndividualGradeExportDTO> data = gradesExportService.exportIndividualGrades(assignmentId);
        
        CsvHandler<Void, IndividualGradeExportDTO> handler = CsvHandlerFactory.getHandler("individual-grade");
        String csvContent = handler.export(data);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvContent.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Export group grades as CSV
     */
    private ResponseEntity<?> exportGroupGradesCsv(Long assignmentId, String filename) {
        List<GroupGradeExportDTO> data = gradesExportService.exportGroupGrades(assignmentId);
        
        CsvHandler<Void, GroupGradeExportDTO> handler = CsvHandlerFactory.getHandler("group-grade");
        String csvContent = handler.export(data);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvContent.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Export both individual and group grades as a ZIP file for mixed assignments
     */
    private ResponseEntity<?> exportMixedGradesAsZip(Long assignmentId, String baseFilename) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {

            // Export individual grades
            List<IndividualGradeExportDTO> individualData = gradesExportService.exportIndividualGrades(assignmentId);
            CsvHandler<Void, IndividualGradeExportDTO> individualHandler = CsvHandlerFactory.getHandler("individual-grade");
            String individualCsv = individualHandler.export(individualData);
            
            ZipEntry individualEntry = new ZipEntry(baseFilename + "_individual.csv");
            zos.putNextEntry(individualEntry);
            zos.write(individualCsv.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            // Export group grades
            List<GroupGradeExportDTO> groupData = gradesExportService.exportGroupGrades(assignmentId);
            CsvHandler<Void, GroupGradeExportDTO> groupHandler = CsvHandlerFactory.getHandler("group-grade");
            String groupCsv = groupHandler.export(groupData);
            
            ZipEntry groupEntry = new ZipEntry(baseFilename + "_group.csv");
            zos.putNextEntry(groupEntry);
            zos.write(groupCsv.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            zos.finish();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + baseFilename + ".zip\"")
                    .contentType(MediaType.parseMediaType("application/zip"))
                    .body(baos.toByteArray());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Result.error(String.valueOf(org.swen90017.oas.constant.HttpStatus.ERROR), "Failed to export mixed grades: " + e.getMessage()));
        }
    }
}
