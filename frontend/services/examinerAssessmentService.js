import examinerAssessmentServiceReal from "./examinerAssessmentService.real";
import examinerAssessmentServiceMock from "./examinerAssessmentService.mock";

// Toggle: default to real API for backend integration
// Set NEXT_PUBLIC_USE_MOCK_API=true to use mock API
const mockFlag = process.env.NEXT_PUBLIC_USE_MOCK_API ?? "false";
const USE_MOCKS = String(mockFlag) === "true";

const service = USE_MOCKS
  ? examinerAssessmentServiceMock
  : examinerAssessmentServiceReal;

// Log which service is being used
if (typeof window !== 'undefined') {
  console.log(`[ExaminerAssessmentService] Using ${USE_MOCKS ? 'MOCK' : 'REAL'} implementation`);
}

export default service;
