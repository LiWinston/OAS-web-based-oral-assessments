import apiClient from '@/services/apiClient.js';

// Lightweight dummy venue service with in-memory state
let mockVenues = [
  { id: 1, name: 'Engineering Building, Room 405' },
  { id: 2, name: 'ICT Building, Room 203' },
  { id: 3, name: 'Science Complex, Lab A2' },
  { id: 4, name: 'Main Hall, Auditorium' }
];

const delay = (ms = 50) => new Promise((res) => setTimeout(res, ms));
const nextId = () => (mockVenues.length ? Math.max(...mockVenues.map(v => v.id)) + 1 : 1);

export const venueService = {
  async list(assignmentId, query = '') {
    const mockFlag = process.env.NEXT_PUBLIC_USE_MOCKS ?? process.env.NEXT_PUBLIC_USE_MOCK_API ?? 'true';
    const USE_MOCKS = String(mockFlag) !== 'false';

    if (!USE_MOCKS && assignmentId) {
      try {
        // eslint-disable-next-line no-console
        console.log('[venueService] GET /api/assignments/{id}/venues', { assignmentId, query, USE_MOCKS });
        const resp = await apiClient.get(`/api/assignments/${assignmentId}/venues`);
        const data = resp?.data?.data || [];
        // Map backend Venue { id, roomName, assignmentId } → UI { id, name }
        const venues = Array.isArray(data)
          ? data.map(v => ({ id: v.id, name: v.roomName }))
          : [];
        const q = (query || '').toLowerCase();
        const filtered = q ? venues.filter(v => v.name.toLowerCase().includes(q)) : venues;
        return { success: true, data: filtered };
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[venueService] API error GET /assignments/{id}/venues', {
          status: e?.response?.status,
          data: e?.response?.data
        });
        // Do not fall back to mock silently; return empty to avoid confusion
        return { success: true, data: [] };
      }
    }

    await delay();
    // Console log for mock list call (only when mocks explicitly enabled)
    // eslint-disable-next-line no-console
    console.log('[venueService] Mock API GET /venues (mocks enabled)', { assignmentId, query, total: mockVenues.length });
    if (!query) return { success: true, data: [...mockVenues] };
    const q = query.toLowerCase();
    const filtered = mockVenues.filter(v => v.name.toLowerCase().includes(q));
    return { success: true, data: filtered };
  },

  async create(name, assignmentId) {
    const mockFlag = process.env.NEXT_PUBLIC_USE_MOCKS ?? process.env.NEXT_PUBLIC_USE_MOCK_API ?? 'true';
    const USE_MOCKS = String(mockFlag) !== 'false';

    if (!USE_MOCKS && assignmentId) {
      try {
        const resp = await apiClient.post(`/api/venues`, {
          roomName: String(name).trim(),
          assignmentId: Number(assignmentId)
        });
        const v = resp?.data?.data;
        const venue = v ? { id: v.id, name: v.roomName } : null;
        if (venue) return { success: true, data: venue };
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[venueService] API error POST /venues', {
          status: e?.response?.status,
          data: e?.response?.data
        });
        // fall through to mock
      }
    }

    await delay();
    // Console log for mock create call
    // eslint-disable-next-line no-console
    console.log('[venueService] Mock API POST /venues', { name, assignmentId });
    const venue = { id: nextId(), name: String(name).trim() };
    mockVenues.push(venue);
    // eslint-disable-next-line no-console
    console.log('[venueService] Created venue', venue);
    return { success: true, data: venue };
  }
};

export default venueService;
