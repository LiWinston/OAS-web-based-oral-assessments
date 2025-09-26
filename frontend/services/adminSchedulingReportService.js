import mockService from "@/services/adminSchedulingReportService.mock";
import realService from "@/services/adminSchedulingReportService.real";

const mockFlag = process.env.NEXT_PUBLIC_USE_MOCK_REPORTS ?? process.env.NEXT_PUBLIC_USE_MOCK_API ?? "true";
const USE_MOCKS = String(mockFlag).toLowerCase() === "true";

const service = USE_MOCKS ? mockService : realService;

if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.info(`[AdminSchedulingReportService] Using ${USE_MOCKS ? "MOCK" : "REAL"} implementation`);
}

export default service;

export const adminSchedulingReportService = service;
