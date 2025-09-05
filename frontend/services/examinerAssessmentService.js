import examinerAssessmentServiceReal from "./examinerAssessmentService.real";
import examinerAssessmentServiceMock from "./examinerAssessmentService.mock";

// Toggle: default to mock for now until backend is ready
// Set NEXT_PUBLIC_USE_MOCK_API=false to use real API
const mockFlag = process.env.NEXT_PUBLIC_USE_MOCK_API ?? "true";
const USE_MOCKS = String(mockFlag) === "true";

const service = USE_MOCKS
  ? examinerAssessmentServiceMock
  : examinerAssessmentServiceReal;

export default service;
