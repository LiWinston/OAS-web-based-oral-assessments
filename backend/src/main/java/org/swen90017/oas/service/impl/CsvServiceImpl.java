package org.swen90017.oas.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.swen90017.oas.handler.csv.CsvHandler;
import org.swen90017.oas.handler.csv.CsvHandlerFactory;
import org.swen90017.oas.service.CsvService;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Service
public class CsvServiceImpl implements CsvService {
    
    @Autowired
    private org.swen90017.oas.mapper.AssignmentMapper assignmentMapper;
    @Autowired
    private org.swen90017.oas.mapper.SubjectMapper subjectMapper;
    
    @Override
    public <T,R> List<T> importCsv(InputStream inputStream, String type) throws IOException {
        CsvHandler<T,R> handler = CsvHandlerFactory.getHandler(type);
        List<T> records = handler.parse(inputStream);
        handler.validate(records);
        return records;
    }
    
    @Override
    public String buildInviteReason(Long assignmentId) {
        if (assignmentId == null) return null;
        org.swen90017.oas.entity.Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) return null;
        org.swen90017.oas.entity.Subject subject = subjectMapper.selectById(assignment.getSubjectId());
        String courseCode = subject != null && subject.getSubjectCode() != null ? subject.getSubjectCode() : "N/A";
        String courseName = subject != null && subject.getSubjectName() != null ? subject.getSubjectName() : "N/A";
        String assignmentCode = assignment.getId() != null ? String.valueOf(assignment.getId()) : "N/A";
        String assignmentName = assignment.getName() != null ? assignment.getName() : "N/A";
        return "Course " + courseCode + " " + courseName + " · Assignment " + assignmentCode + " " + assignmentName;
    }
}
