import { courseAdminTimeslotServiceReal } from '@/services/courseAdminTimeslot.real.js';
import { courseAdminTimeslotServiceMock } from '@/services/courseAdminTimeslot.mock.js';

/**
 * Service factory for switching between real and mock services
 * Controlled by NEXT_PUBLIC_USE_MOCKS environment variable
 */
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export const courseAdminTimeslotService = USE_MOCKS 
  ? courseAdminTimeslotServiceMock 
  : courseAdminTimeslotServiceReal;

export { USE_MOCKS };