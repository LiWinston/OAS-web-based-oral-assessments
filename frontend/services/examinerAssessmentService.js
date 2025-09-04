import examinerAssessmentServiceReal from "./examinerAssessmentService.real";
import examinerAssessmentServiceMock from "./examinerAssessmentService.mock";

// Toggle: default to mock for now until backend is ready
// Set NEXT_PUBLIC_EXAMINER_ASSESSMENT_USE_MOCKS=false to use real API
const mockFlag =
  process.env.NEXT_PUBLIC_EXAMINER_ASSESSMENT_USE_MOCKS ??
  process.env.NEXT_PUBLIC_USE_MOCKS ??
  "true";
const USE_MOCKS = String(mockFlag) !== "true";

const service = USE_MOCKS
  ? examinerAssessmentServiceMock
  : examinerAssessmentServiceReal;

export default service;
