package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.RubricMetaInfo;
import org.swen90017.oas.dto.RubricsInfoDto;
import org.swen90017.oas.dto.request.SaveAssessmentDraftRequestDTO;
import org.swen90017.oas.dto.response.GroupGradeExportDTO;
import org.swen90017.oas.dto.response.IndividualGradeExportDTO;
import org.swen90017.oas.dto.response.TeacherScoringDetailExportDTO;
import org.swen90017.oas.entity.*;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.GradesExportService;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GradesExportServiceImpl implements GradesExportService {

    private final AssignmentMapper assignmentMapper;
    private final AssessmentSubmissionMapper assessmentSubmissionMapper;
    private final SysUserMapper sysUserMapper;
    private final SysStudentMapper sysStudentMapper;
    private final GroupMapper groupMapper;
    private final SysStudentGroupMapper sysStudentGroupMapper;
    private final SlotSessionMapper slotSessionMapper;
    private final VenueMapper venueMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public List<IndividualGradeExportDTO> exportIndividualGrades(Long assignmentId) {
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // Query all INDIVIDUAL assessment submissions for this assignment
        QueryWrapper<AssessmentSubmission> wrapper = new QueryWrapper<>();
        wrapper.eq("assignment_id", assignmentId);
        wrapper.eq("subject_type", "INDIVIDUAL");
        wrapper.eq("status", "SUBMITTED");
        List<AssessmentSubmission> submissions = assessmentSubmissionMapper.selectList(wrapper);

        // Get rubric information
        List<String> rubricColumns = extractRubricColumns(assignment, "INDIVIDUAL");

        // Group submissions by student (subject_id) and calculate average scores
        Map<Long, List<AssessmentSubmission>> submissionsByStudent = submissions.stream()
                .collect(Collectors.groupingBy(AssessmentSubmission::getSubjectId));

        List<IndividualGradeExportDTO> result = new ArrayList<>();

        for (Map.Entry<Long, List<AssessmentSubmission>> entry : submissionsByStudent.entrySet()) {
            Long studentId = entry.getKey();
            List<AssessmentSubmission> studentSubmissions = entry.getValue();

            // Get student information
            SysUser user = sysUserMapper.selectById(studentId);
            SysStudent student = sysStudentMapper.selectById(studentId);

            if (user == null) {
                log.warn("Student user not found: {}", studentId);
                continue;
            }

            IndividualGradeExportDTO dto = new IndividualGradeExportDTO();
            dto.setStudent(user.getUserName());
            dto.setId(String.valueOf(user.getUserId()));
            dto.setSisUserId(student != null ? student.getSisUserId() : "");
            dto.setSisLoginId(user.getEmail() != null ? user.getEmail().split("@")[0] : "");
            dto.setSection("");  // Section can be populated if available
            dto.setStudentId(student != null ? student.getStudentNumber() : "");

            // Calculate average scores for each rubric
            Map<String, String> rubricScores = calculateAverageRubricScores(studentSubmissions, rubricColumns, "INDIVIDUAL");
            dto.setRubricScores(rubricScores);

            result.add(dto);
        }

        // Sort by student name
        result.sort(Comparator.comparing(IndividualGradeExportDTO::getStudent, 
                Comparator.nullsLast(Comparator.naturalOrder())));

        return result;
    }

    @Override
    public List<GroupGradeExportDTO> exportGroupGrades(Long assignmentId) {
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // Query all GROUP assessment submissions for this assignment
        QueryWrapper<AssessmentSubmission> wrapper = new QueryWrapper<>();
        wrapper.eq("assignment_id", assignmentId);
        wrapper.in("subject_type", Arrays.asList("GROUP", "MIX"));
        wrapper.eq("status", "SUBMITTED");
        List<AssessmentSubmission> submissions = assessmentSubmissionMapper.selectList(wrapper);

        // Get rubric information
        List<String> rubricColumns = extractRubricColumns(assignment, "GROUP");

        // Group submissions by group (subject_id) and calculate average scores
        Map<Long, List<AssessmentSubmission>> submissionsByGroup = submissions.stream()
                .collect(Collectors.groupingBy(AssessmentSubmission::getSubjectId));

        List<GroupGradeExportDTO> result = new ArrayList<>();

        for (Map.Entry<Long, List<AssessmentSubmission>> entry : submissionsByGroup.entrySet()) {
            Long groupId = entry.getKey();
            List<AssessmentSubmission> groupSubmissions = entry.getValue();

            // Get group information
            SysGroup group = groupMapper.selectById(groupId);
            if (group == null) {
                log.warn("Group not found: {}", groupId);
                continue;
            }

            // Get all students in the group
            QueryWrapper<SysStudentGroup> sgWrapper = new QueryWrapper<>();
            sgWrapper.eq("group_id", groupId);
            List<SysStudentGroup> studentGroups = sysStudentGroupMapper.selectList(sgWrapper);

            // Create one row for each student in the group
            for (SysStudentGroup studentGroup : studentGroups) {
                Long studentId = studentGroup.getUserId();
                SysUser user = sysUserMapper.selectById(studentId);
                SysStudent student = sysStudentMapper.selectById(studentId);

                if (user == null) {
                    log.warn("Student user not found: {}", studentId);
                    continue;
                }

                GroupGradeExportDTO dto = new GroupGradeExportDTO();
                dto.setName(user.getUserName());
                dto.setCanvasUserId(String.valueOf(user.getUserId()));
                dto.setSisId(student != null ? student.getSisUserId() : "");
                dto.setLoginId(user.getEmail() != null ? user.getEmail().split("@")[0] : "");
                dto.setSection("");  // Section can be populated if available
                dto.setGroupName(group.getGroupName());
                dto.setCanvasGroupId(group.getCanvasGroupId());

                // Calculate average scores for each rubric
                Map<String, String> rubricScores = calculateAverageRubricScores(groupSubmissions, rubricColumns, "GROUP");
                dto.setRubricScores(rubricScores);

                result.add(dto);
            }
        }

        // Sort by group name then student name
        result.sort(Comparator.comparing(GroupGradeExportDTO::getGroupName, 
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(GroupGradeExportDTO::getName, 
                        Comparator.nullsLast(Comparator.naturalOrder())));

        return result;
    }

    @Override
    public List<TeacherScoringDetailExportDTO> exportTeacherScoringDetails(Long assignmentId) {
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        String assignmentType = assignment.getType();
        List<TeacherScoringDetailExportDTO> result = new ArrayList<>();

        // Handle based on assignment type
        if ("individual".equalsIgnoreCase(assignmentType)) {
            result = exportIndividualTeacherScoringDetails(assignmentId);
        } else if ("group".equalsIgnoreCase(assignmentType) || "mixed".equalsIgnoreCase(assignmentType)) {
            result = exportGroupTeacherScoringDetails(assignmentId);
        }

        return result;
    }

    private List<TeacherScoringDetailExportDTO> exportIndividualTeacherScoringDetails(Long assignmentId) {
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        
        // Query all INDIVIDUAL assessment submissions
        QueryWrapper<AssessmentSubmission> wrapper = new QueryWrapper<>();
        wrapper.eq("assignment_id", assignmentId);
        wrapper.eq("subject_type", "INDIVIDUAL");
        wrapper.eq("status", "SUBMITTED");
        List<AssessmentSubmission> submissions = assessmentSubmissionMapper.selectList(wrapper);

        // Get rubric information
        List<String> rubricColumns = extractRubricColumns(assignment, "INDIVIDUAL");

        List<TeacherScoringDetailExportDTO> result = new ArrayList<>();

        for (AssessmentSubmission submission : submissions) {
            Long studentId = submission.getSubjectId();
            Long examinerId = submission.getExaminerId();

            // Get student information
            SysUser student = sysUserMapper.selectById(studentId);
            SysStudent studentInfo = sysStudentMapper.selectById(studentId);
            SysUser examiner = sysUserMapper.selectById(examinerId);

            if (student == null || examiner == null) {
                continue;
            }

            TeacherScoringDetailExportDTO dto = new TeacherScoringDetailExportDTO();
            dto.setName(student.getUserName());
            dto.setCanvasUserId(String.valueOf(student.getUserId()));
            dto.setSisId(studentInfo != null ? studentInfo.getSisUserId() : "");
            dto.setLoginId(student.getEmail() != null ? student.getEmail().split("@")[0] : "");
            dto.setSection("");
            dto.setGroupName("");  // No group for individual
            dto.setCanvasGroupId("");
            dto.setExaminerName(examiner.getUserName());
            dto.setExaminerUsername(examiner.getEmail() != null ? examiner.getEmail().split("@")[0] : "");

            // Get session information
            if (submission.getSessionId() != null) {
                SlotSession session = slotSessionMapper.selectById(submission.getSessionId());
                if (session != null) {
                    dto.setExamDate(session.getStartAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
                    dto.setExamTimeSlot(session.getStartAt().format(DateTimeFormatter.ofPattern("HH:mm")) + 
                            "-" + session.getEndAt().format(DateTimeFormatter.ofPattern("HH:mm")));
                    
                    if (session.getVenueId() != null) {
                        Venue venue = venueMapper.selectById(session.getVenueId());
                        dto.setExamVenue(venue != null ? venue.getRoomName() : "");
                    } else {
                        dto.setExamVenue("");
                    }
                } else {
                    dto.setExamDate("");
                    dto.setExamTimeSlot("");
                    dto.setExamVenue("");
                }
            } else {
                dto.setExamDate("");
                dto.setExamTimeSlot("");
                dto.setExamVenue("");
            }

            // Extract scores for this submission
            Map<String, String> rubricScores = extractSubmissionScores(submission, rubricColumns, "INDIVIDUAL");
            dto.setRubricScores(rubricScores);

            result.add(dto);
        }

        // Sort by student name then examiner name
        result.sort(Comparator.comparing(TeacherScoringDetailExportDTO::getName, 
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(TeacherScoringDetailExportDTO::getExaminerName, 
                        Comparator.nullsLast(Comparator.naturalOrder())));

        return result;
    }

    private List<TeacherScoringDetailExportDTO> exportGroupTeacherScoringDetails(Long assignmentId) {
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        
        // Query all GROUP/MIX assessment submissions
        QueryWrapper<AssessmentSubmission> wrapper = new QueryWrapper<>();
        wrapper.eq("assignment_id", assignmentId);
        wrapper.in("subject_type", Arrays.asList("GROUP", "MIX"));
        wrapper.eq("status", "SUBMITTED");
        List<AssessmentSubmission> submissions = assessmentSubmissionMapper.selectList(wrapper);

        // Get rubric information
        List<String> rubricColumns = extractRubricColumns(assignment, "GROUP");

        List<TeacherScoringDetailExportDTO> result = new ArrayList<>();

        for (AssessmentSubmission submission : submissions) {
            Long groupId = submission.getSubjectId();
            Long examinerId = submission.getExaminerId();

            // Get group information
            SysGroup group = groupMapper.selectById(groupId);
            SysUser examiner = sysUserMapper.selectById(examinerId);

            if (group == null || examiner == null) {
                continue;
            }

            // Get all students in the group
            QueryWrapper<SysStudentGroup> sgWrapper = new QueryWrapper<>();
            sgWrapper.eq("group_id", groupId);
            List<SysStudentGroup> studentGroups = sysStudentGroupMapper.selectList(sgWrapper);

            // Get session information
            String examDate = "";
            String examTimeSlot = "";
            String examVenue = "";
            
            if (submission.getSessionId() != null) {
                SlotSession session = slotSessionMapper.selectById(submission.getSessionId());
                if (session != null) {
                    examDate = session.getStartAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                    examTimeSlot = session.getStartAt().format(DateTimeFormatter.ofPattern("HH:mm")) + 
                            "-" + session.getEndAt().format(DateTimeFormatter.ofPattern("HH:mm"));
                    
                    if (session.getVenueId() != null) {
                        Venue venue = venueMapper.selectById(session.getVenueId());
                        examVenue = venue != null ? venue.getRoomName() : "";
                    }
                }
            }

            // Extract scores for this submission
            Map<String, String> rubricScores = extractSubmissionScores(submission, rubricColumns, "GROUP");

            // Create one row for each student in the group
            for (SysStudentGroup studentGroup : studentGroups) {
                Long studentId = studentGroup.getUserId();
                SysUser student = sysUserMapper.selectById(studentId);
                SysStudent studentInfo = sysStudentMapper.selectById(studentId);

                if (student == null) {
                    continue;
                }

                TeacherScoringDetailExportDTO dto = new TeacherScoringDetailExportDTO();
                dto.setName(student.getUserName());
                dto.setCanvasUserId(String.valueOf(student.getUserId()));
                dto.setSisId(studentInfo != null ? studentInfo.getSisUserId() : "");
                dto.setLoginId(student.getEmail() != null ? student.getEmail().split("@")[0] : "");
                dto.setSection("");
                dto.setGroupName(group.getGroupName());
                dto.setCanvasGroupId(group.getCanvasGroupId());
                dto.setExaminerName(examiner.getUserName());
                dto.setExaminerUsername(examiner.getEmail() != null ? examiner.getEmail().split("@")[0] : "");
                dto.setExamDate(examDate);
                dto.setExamTimeSlot(examTimeSlot);
                dto.setExamVenue(examVenue);
                dto.setRubricScores(rubricScores);

                result.add(dto);
            }
        }

        // Sort by group name then student name then examiner name
        result.sort(Comparator.comparing(TeacherScoringDetailExportDTO::getGroupName, 
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(TeacherScoringDetailExportDTO::getName, 
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(TeacherScoringDetailExportDTO::getExaminerName, 
                        Comparator.nullsLast(Comparator.naturalOrder())));

        return result;
    }

    /**
     * Extract rubric column headers
     */
    private List<String> extractRubricColumns(Assignment assignment, String subjectType) {
        List<String> columns = new ArrayList<>();
        try {
            String rubricMetaInfo = assignment.getRubricMetaInfo();
            if (rubricMetaInfo == null || rubricMetaInfo.trim().isEmpty()) {
                return columns;
            }

            RubricMetaInfo metaInfo = objectMapper.readValue(rubricMetaInfo, RubricMetaInfo.class);
            List<RubricsInfoDto> rubrics = null;

            if ("INDIVIDUAL".equals(subjectType)) {
                rubrics = metaInfo.getIndividualRubrics();
            } else if ("GROUP".equals(subjectType)) {
                rubrics = metaInfo.getGroupRubrics();
            }

            if (rubrics != null) {
                for (RubricsInfoDto rubric : rubrics) {
                    // Format: Sample1 or Sample1(ID) if ID exists
                    // Since RubricsInfoDto doesn't have sampleId, just use description
                    String columnName = rubric.getDescription();
                    columns.add(columnName);
                }
            }
        } catch (Exception e) {
            log.error("Failed to extract rubric columns", e);
        }
        return columns;
    }

    /**
     * Calculate average rubric scores from multiple submissions
     */
    private Map<String, String> calculateAverageRubricScores(List<AssessmentSubmission> submissions, 
                                                              List<String> rubricColumns, 
                                                              String subjectType) {
        Map<String, String> result = new LinkedHashMap<>();
        
        // Initialize with column names
        for (String column : rubricColumns) {
            result.put(column, "");
        }

        if (submissions.isEmpty()) {
            return result;
        }

        // Collect scores for each rubric across all submissions
        Map<String, List<Double>> scoresByRubric = new HashMap<>();
        
        for (AssessmentSubmission submission : submissions) {
            try {
                String scoresJson = submission.getScoresJson();
                if (scoresJson == null || scoresJson.trim().isEmpty()) {
                    continue;
                }

                List<SaveAssessmentDraftRequestDTO.ScoreItem> scores = 
                        objectMapper.readValue(scoresJson, new TypeReference<List<SaveAssessmentDraftRequestDTO.ScoreItem>>(){});

                for (SaveAssessmentDraftRequestDTO.ScoreItem score : scores) {
                    String rubricDesc = score.getDescription();
                    if (rubricDesc != null && score.getInputPoints() != null) {
                        scoresByRubric.computeIfAbsent(rubricDesc, k -> new ArrayList<>()).add(score.getInputPoints());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to parse scores JSON", e);
            }
        }

        // Calculate averages and populate result
        for (String column : rubricColumns) {
            // Extract rubric description from column name (remove sample ID part)
            String rubricDesc = column;
            int parenIndex = column.indexOf(" (");
            if (parenIndex > 0) {
                rubricDesc = column.substring(0, parenIndex);
            }

            List<Double> scores = scoresByRubric.get(rubricDesc);
            if (scores != null && !scores.isEmpty()) {
                double average = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                result.put(column, String.format("%.2f", average));
            } else {
                result.put(column, "");
            }
        }

        return result;
    }

    /**
     * Extract rubric scores from a single submission
     */
    private Map<String, String> extractSubmissionScores(AssessmentSubmission submission, 
                                                         List<String> rubricColumns, 
                                                         String subjectType) {
        Map<String, String> result = new LinkedHashMap<>();
        
        // Initialize with column names
        for (String column : rubricColumns) {
            result.put(column, "");
        }

        try {
            String scoresJson = submission.getScoresJson();
            if (scoresJson == null || scoresJson.trim().isEmpty()) {
                return result;
            }

            List<SaveAssessmentDraftRequestDTO.ScoreItem> scores = 
                    objectMapper.readValue(scoresJson, new TypeReference<List<SaveAssessmentDraftRequestDTO.ScoreItem>>(){});

            Map<String, Double> scoreMap = new HashMap<>();
            for (SaveAssessmentDraftRequestDTO.ScoreItem score : scores) {
                if (score.getDescription() != null && score.getInputPoints() != null) {
                    scoreMap.put(score.getDescription(), score.getInputPoints());
                }
            }

            // Populate result
            for (String column : rubricColumns) {
                // Extract rubric description from column name (remove sample ID part)
                String rubricDesc = column;
                int parenIndex = column.indexOf(" (");
                if (parenIndex > 0) {
                    rubricDesc = column.substring(0, parenIndex);
                }

                Double score = scoreMap.get(rubricDesc);
                if (score != null) {
                    result.put(column, String.format("%.2f", score));
                } else {
                    result.put(column, "");
                }
            }
        } catch (Exception e) {
            log.error("Failed to extract submission scores", e);
        }

        return result;
    }
}

