import examinerAssessmentServiceReal from "./examinerAssessmentService.real";

if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.info("[ExaminerAssessmentService] Using REAL implementation");
}

export default examinerAssessmentServiceReal;
export const examinerAssessmentService = examinerAssessmentServiceReal;
