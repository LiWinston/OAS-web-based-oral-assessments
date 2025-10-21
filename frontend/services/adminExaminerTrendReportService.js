import realService from "@/services/adminExaminerTrendReportService.real";

if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.info("[AdminExaminerTrendReportService] Using REAL implementation");
}

export const adminExaminerTrendReportService = realService;

export default realService;
