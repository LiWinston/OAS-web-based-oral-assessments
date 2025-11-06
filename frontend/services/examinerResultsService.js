import examinerResultsServiceReal from "./examinerResultsService.real";

if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.info("[ExaminerResultsService] Using REAL implementation");
}

export const examinerResultsService = examinerResultsServiceReal;
export default examinerResultsServiceReal;
