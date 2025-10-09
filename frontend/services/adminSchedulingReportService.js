import realService from "@/services/adminSchedulingReportService.real";

// Always use REAL service; mock and fallback removed per product decision
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.info("[AdminSchedulingReportService] Using REAL implementation");
}

export default realService;

export const adminSchedulingReportService = realService;
