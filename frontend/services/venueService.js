import apiClient from "@/services/apiClient.js";

export const venueService = {
  async list(assignmentId, query = "") {
    if (!assignmentId) {
      throw new Error("assignmentId is required to list venues");
    }

    const response = await apiClient.get(
      `/api/assignments/${assignmentId}/venues`
    );
    const data = response?.data?.data || [];
    const venues = Array.isArray(data)
      ? data.map((v) => ({ id: v.id, name: v.roomName ?? v.name ?? "" }))
      : [];

    const q = (query || "").toLowerCase();
    return {
      success: true,
      data: q ? venues.filter((v) => v.name.toLowerCase().includes(q)) : venues,
    };
  },

  async create(name, assignmentId) {
    if (!assignmentId) {
      throw new Error("assignmentId is required to create a venue");
    }
    const trimmed = String(name).trim();
    if (!trimmed) {
      throw new Error("Venue name is required");
    }

    const response = await apiClient.post(`/api/venues`, {
      roomName: trimmed,
      assignmentId: Number(assignmentId),
    });
    const venue = response?.data?.data;
    return {
      success: true,
      data: venue ? { id: venue.id, name: venue.roomName ?? trimmed } : null,
    };
  },
};

export default venueService;
