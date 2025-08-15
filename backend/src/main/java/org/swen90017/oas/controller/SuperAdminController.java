package org.swen90017.oas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.ListAdminsRequestDTO;
import org.swen90017.oas.dto.request.UpdateAdminStatusRequestDTO;
import org.swen90017.oas.dto.request.RevokeAdminAccessRequestDTO;
import org.swen90017.oas.dto.response.CheckEmailResponseDTO;
import org.swen90017.oas.dto.response.ListAdminsResponseDTO;
import org.swen90017.oas.dto.response.RevokeAdminAccessResponseDTO;
import org.swen90017.oas.dto.response.UpdateAdminStatusResponseDTO;
import org.swen90017.oas.service.SuperAdminService;
import org.swen90017.oas.dto.request.AdminInviteDTO;
import org.swen90017.oas.entity.SysAdmin;
import org.springframework.web.multipart.MultipartFile;
import org.swen90017.oas.service.CsvService;
import org.swen90017.oas.common.BusinessError;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import org.swen90017.oas.service.EmailService;
import org.swen90017.oas.utils.TransactionUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/superadmin")
@Tag(name = "Super Admin APIs", description = "Endpoints for super administrator management")
public class SuperAdminController {
    @Autowired
    private SuperAdminService superAdminService;
    @Autowired
    private CsvService csvService;
    @Autowired
    private EmailService emailService;

    @PostMapping("admins")
    /**
     * List administrators (SUPER_ADMIN endpoint).
     *
     * <p>POST /api/superadmin/admins
     *
     * @param requestDTO request body including filters, sorting and pagination
     * @return a standard Result wrapping {@link ListAdminsResponseDTO}
     */
    @Operation(summary = "List course administrators", description = "List admins with pagination, sorting and optional filters")
    public Result<ListAdminsResponseDTO> listAdmins(@RequestBody ListAdminsRequestDTO requestDTO) {
        ListAdminsResponseDTO resp = superAdminService.listAdmins(requestDTO);
        System.out.println(resp);
        return Result.success(resp);
    }

    // POST /api/superadmin/admins/invite
    @PostMapping("admins/invite")
    @Operation(summary = "Invite a new course administrator", description = "Create an invited admin user and send invitation token")
    public Result<SysAdmin> inviteAdmin(@RequestBody AdminInviteDTO request) {
        SysAdmin invited = TransactionUtil.doTransactionWithRequired(() -> superAdminService.inviteAdmin(request));
        try {
            emailService.sendAdminActivationEmail(invited);
        } catch (Exception ignored) {}
        return Result.success(invited);
    }

    @PostMapping("admins/invite/import")
    @Operation(summary = "Import course admins via CSV", description = "Upload a CSV file to invite multiple course administrators")
    public Result<?> importAdminCsv(@RequestParam("file") MultipartFile file,
                                    @RequestParam("type") String type) throws IOException {
        List<?> csvData = csvService.importCsv(file.getInputStream(), type);
        if (csvData == null || csvData.isEmpty()) {
            return Result.error(BusinessError.CSV_READ_FAILED);
        }

        if ("admin".equalsIgnoreCase(type)) {
            @SuppressWarnings("unchecked")
            List<AdminInviteDTO> admins = (List<AdminInviteDTO>) csvData;
            List<SysAdmin> invited = TransactionUtil.doTransactionWithRequired(() -> superAdminService.inviteAdminsFromCsv(admins));
            try {
                emailService.sendAdminActivationEmail(invited);
            } catch (Exception ignored) {}
            return Result.success(invited);
        } else {
            return Result.error(BusinessError.INVALID_CSV_TYPE);
        }
    }
    @GetMapping("admins/{id}")
    @Operation(summary = "Get admin detail", description = "Get detailed info of a specific course administrator by id")
    public Result<SysAdmin> getAdminById(@Parameter(description = "Admin user id", example = "123") @PathVariable String id) {
        SysAdmin admin = superAdminService.getAdminDetail(id);
        return Result.success(admin);
    }

    @PostMapping("admins/{id}/status")
    @Operation(summary = "Update admin status", description = "Update status to ACTIVE/INACTIVE/INVITED/EXPIRED")
    public Result<UpdateAdminStatusResponseDTO> updateAdminStatus(
            @Parameter(description = "Admin user id", example = "123") @PathVariable String id,
            @RequestBody UpdateAdminStatusRequestDTO request
    ) {
        UpdateAdminStatusResponseDTO resp = superAdminService.updateAdminStatus(id, request.getStatus(), request.getReason());
        return Result.success(resp, "Admin status updated successfully");
    }

    @GetMapping("admins/status")
    @Operation(summary = "Get admin status list (Do not test yet)", description = "Placeholder endpoint for future use")
    public String getAdminStatus() {
        // This is a placeholder method. In a real application, you would return the status of all admins.
        return "Status of all super admins";
    }

    @GetMapping("admins/check-email/{email}")
    @Operation(summary = "Check admin email", description = "Validate email format and check if it already exists")
    public Result<CheckEmailResponseDTO> checkAdminEmailExists(@Parameter(description = "Email to check", example = "test@student.unimelb.edu.au") @PathVariable String email) {
        CheckEmailResponseDTO resp = superAdminService.checkEmail(email);
        return Result.success(resp);
    }

    @PostMapping("admins/revoke/{id}")
    @Operation(summary = "Revoke admin access", description = "Logically revoke admin by setting status to INACTIVE and optionally transfer courses (placeholder)")
    public Result<RevokeAdminAccessResponseDTO> revokeAdmin(
            @Parameter(description = "Admin user id", example = "123") @PathVariable String id,
            @RequestBody RevokeAdminAccessRequestDTO request
    ) {
        RevokeAdminAccessResponseDTO resp = superAdminService.revokeAdmin(id, request.getReason(), request.getTransferCoursesTo());
        return Result.success(resp, "Admin access revoked successfully");
    }

    @GetMapping("courses")
    @Operation(summary = "List courses (Do not test yet)", description = "Placeholder endpoint for future use")
    public String getCourses() {
        // This is a placeholder method. In a real application, you would return a list of courses.
        return "List of courses";
    }

    @GetMapping("courses/{id}")
    @Operation(summary = "Get course by id (Do not test yet)", description = "Placeholder endpoint for future use")
    public String getCourseById(@Parameter(description = "Course id", example = "abc-uuid") @PathVariable String id) {
        // This is a placeholder method. In a real application, you would return the details of the course with the given ID.
        return "Details of course with ID: " + id;
    }

}
