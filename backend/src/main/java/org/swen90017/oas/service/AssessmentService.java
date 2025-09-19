package org.swen90017.oas.service;

import org.swen90017.oas.dto.request.ExaminerAssessmentsQueryDTO;
import org.swen90017.oas.dto.request.SaveAssessmentDraftRequestDTO;
import org.swen90017.oas.dto.request.SubmitAssessmentRequestDTO;
import org.swen90017.oas.dto.response.AssessmentSubmissionDTO;
import org.swen90017.oas.dto.response.ExaminerSummaryDTO;
import org.swen90017.oas.dto.response.ExaminerAssessmentsPageResponseDTO;

import java.util.List;

public interface AssessmentService {
    AssessmentSubmissionDTO saveDraft(SaveAssessmentDraftRequestDTO request, Long examinerId);
    AssessmentSubmissionDTO submit(SubmitAssessmentRequestDTO request, Long examinerId);
    AssessmentSubmissionDTO getMySubmission(Long submissionId, Long examinerId);
    List<AssessmentSubmissionDTO> listMySubmissions(ExaminerAssessmentsQueryDTO query, Long examinerId);
    ExaminerAssessmentsPageResponseDTO pageMySubmissions(ExaminerAssessmentsQueryDTO query, Long examinerId);
    ExaminerSummaryDTO getMySummary(ExaminerAssessmentsQueryDTO query, Long examinerId);
}


