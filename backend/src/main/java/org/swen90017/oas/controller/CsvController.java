package org.swen90017.oas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.GroupCSVRequestDTO;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.service.CsvService;
import org.swen90017.oas.service.EmailService;
import org.swen90017.oas.service.GroupService;
import org.swen90017.oas.service.StudentService;
import org.swen90017.oas.utils.TransactionUtil;

import java.io.IOException;
import java.util.List;
@RestController
@RequestMapping("/api/csv")
public class CsvController {
    @Autowired
    private CsvService csvService;
    @Autowired
    private StudentService studentService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private GroupService groupService;

    @PostMapping("/import")
    public Result importCsv(@RequestParam("file") MultipartFile file,
                            @RequestParam("type") String type) throws IOException {
        List<?> result = csvService.importCsv(file.getInputStream(), type);
        if (result == null || result.isEmpty()) {
            return Result.error(BusinessError.CSV_READ_FAILED);
        }
        if ("student".equalsIgnoreCase(type)) {
            List<StudentCSVRequestDTO> studentDTOs = (List<StudentCSVRequestDTO>) result;
            List<SysStudent> sysStudents = TransactionUtil.doTransactionWithRequired(() -> {
                List<SysStudent> invited = studentService.inviteStudent(studentDTOs);
                emailService.sendActivationEmail(invited);
                return invited;
            });
            return Result.success(sysStudents);
        } else if ("group".equalsIgnoreCase(type)) {
            List<GroupCSVRequestDTO> groupDTOs = (List<GroupCSVRequestDTO>) result;
            List<SysStudent> sysStudents = TransactionUtil.doTransactionWithRequired(() -> {
                List<SysStudent> invited = groupService.importGroupData(groupDTOs);
                emailService.sendActivationEmail(invited);
                return invited;
            });
            return Result.success(sysStudents);
        } else {
            return Result.error(BusinessError.INVALID_CSV_TYPE);
        }
    }
}
