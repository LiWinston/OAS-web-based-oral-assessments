import adminResultsServiceReal from "./adminResultsService.real";
import adminResultsServiceMock from "./adminResultsService.mock";

// Toggle via NEXT_PUBLIC_USE_MOCK_API (true = mock)
const mockFlag = process.env.NEXT_PUBLIC_USE_MOCK_API ?? "true";
const USE_MOCKS = String(mockFlag) === "true";

const service = USE_MOCKS ? adminResultsServiceMock : adminResultsServiceReal;

export default service;
export const adminResultsService = service;

