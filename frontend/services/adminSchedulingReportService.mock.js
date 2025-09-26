const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

const formatTime = (value) => {
  if (!value) return value;
  if (value.length === 5) return `${value}:00`;
  return value;
};

const makeSession = (override) => {
  const base = {
    capacity: 1,
    bookedCount: 0,
    remainingCapacity: 1,
    requiredExaminers: 2,
    assignedExaminers: [],
    enrolledStudents: [],
    enrolledGroups: [],
    publishedToExaminer: true,
    publishedToStudent: false,
    status: "OPEN",
  };

  const session = { ...base, ...override };
  const assignedCount = Array.isArray(session.assignedExaminers)
    ? session.assignedExaminers.length
    : 0;
  const staffingStatus = assignedCount === 0
    ? "none"
    : assignedCount < session.requiredExaminers
      ? "partial"
      : "fully";

  return {
    ...session,
    startTime: formatTime(session.startTime),
    endTime: formatTime(session.endTime),
    staffingStatus,
    remainingCapacity:
      session.capacity - session.bookedCount >= 0
        ? session.capacity - session.bookedCount
        : 0,
  };
};

const MOCK_ASSIGNMENTS = {
  "42": {
    meta: {
      id: 42,
      name: "Capstone Demo",
      courseName: "Software Engineering Process",
      courseCode: "SWEN90009",
      windowStart: "2025-09-12",
      windowEnd: "2025-09-20",
      timezone: "Australia/Melbourne",
    },
    publish: { examiners: true, students: false },
    sessions: [
      makeSession({
        id: 4201,
        date: "2025-09-15",
        startTime: "09:00",
        endTime: "09:30",
        venueId: "VEN-ENG405",
        venueName: "ENG 405",
        capacity: 1,
        bookedCount: 1,
        assignedExaminers: [
          { id: 1, name: "Dr. Maya Singh" },
          { id: 2, name: "Prof. Alex Chen" },
        ],
        enrolledStudents: [{ id: 1001, name: "Alice Zhang" }],
      }),
      makeSession({
        id: 4202,
        date: "2025-09-15",
        startTime: "09:45",
        endTime: "10:15",
        venueId: "VEN-ENG405",
        venueName: "ENG 405",
        capacity: 1,
        bookedCount: 1,
        assignedExaminers: [{ id: 1, name: "Dr. Maya Singh" }],
        requiredExaminers: 2,
        enrolledStudents: [{ id: 1002, name: "Bryce Taylor" }],
      }),
      makeSession({
        id: 4203,
        date: "2025-09-15",
        startTime: "10:30",
        endTime: "11:00",
        venueId: "VEN-ENG410",
        venueName: "ENG 410",
        capacity: 1,
        bookedCount: 1,
        requiredExaminers: 2,
        assignedExaminers: [],
        publishedToExaminer: false,
        enrolledStudents: [{ id: 1010, name: "Group Delta" }],
      }),
      makeSession({
        id: 4204,
        date: "2025-09-16",
        startTime: "09:00",
        endTime: "09:30",
        venueId: "VEN-ENG405",
        venueName: "ENG 405",
        capacity: 1,
        bookedCount: 1,
        assignedExaminers: [
          { id: 3, name: "Dr. Helen Lee" },
          { id: 4, name: "Dr. William Ko" },
        ],
        enrolledStudents: [{ id: 1030, name: "Charlie Xu" }],
      }),
      makeSession({
        id: 4205,
        date: "2025-09-16",
        startTime: "09:45",
        endTime: "10:15",
        venueId: "VEN-ENG410",
        venueName: "ENG 410",
        capacity: 1,
        bookedCount: 0,
        requiredExaminers: 1,
        assignedExaminers: [{ id: 3, name: "Dr. Helen Lee" }],
        publishedToStudent: true,
      }),
      makeSession({
        id: 4206,
        date: "2025-09-17",
        startTime: "11:00",
        endTime: "11:30",
        venueId: "VEN-ENG420",
        venueName: "ENG 420",
        capacity: 1,
        bookedCount: 1,
        requiredExaminers: 3,
        assignedExaminers: [
          { id: 5, name: "Dr. Usha Patel" },
          { id: 6, name: "Dr. Ben Torres" },
        ],
        enrolledGroups: [{ id: "G-01", name: "Team Aurora", members: 4 }],
      }),
    ],
  },
  "77": {
    meta: {
      id: 77,
      name: "Industry Pitch",
      courseName: "Innovation Lab",
      courseCode: "INFO98765",
      windowStart: "2025-10-01",
      windowEnd: "2025-10-08",
      timezone: "Australia/Melbourne",
    },
    publish: { examiners: false, students: false },
    sessions: [
      makeSession({
        id: 7701,
        date: "2025-10-02",
        startTime: "13:00",
        endTime: "13:25",
        venueId: "VEN-SPC201",
        venueName: "Science Park 201",
        capacity: 2,
        bookedCount: 2,
        requiredExaminers: 2,
        assignedExaminers: [{ id: 11, name: "Prof. Nina Gomez" }],
        enrolledGroups: [{ id: "G-15", name: "Team Horizon", members: 5 }],
      }),
      makeSession({
        id: 7702,
        date: "2025-10-02",
        startTime: "13:30",
        endTime: "13:55",
        venueId: "VEN-SPC201",
        venueName: "Science Park 201",
        capacity: 2,
        bookedCount: 1,
        requiredExaminers: 2,
        assignedExaminers: [
          { id: 11, name: "Prof. Nina Gomez" },
          { id: 12, name: "Mr. Felix Chan" },
        ],
        enrolledGroups: [{ id: "G-18", name: "Team Atlas", members: 5 }],
      }),
      makeSession({
        id: 7703,
        date: "2025-10-03",
        startTime: "10:00",
        endTime: "10:25",
        venueId: "VEN-SPC304",
        venueName: "Science Park 304",
        capacity: 2,
        bookedCount: 0,
        requiredExaminers: 1,
        assignedExaminers: [],
      }),
      makeSession({
        id: 7704,
        date: "2025-10-03",
        startTime: "10:35",
        endTime: "11:00",
        venueId: "VEN-SPC304",
        venueName: "Science Park 304",
        capacity: 2,
        bookedCount: 1,
        requiredExaminers: 1,
        assignedExaminers: [{ id: 13, name: "Dr. Marco Li" }],
        publishedToExaminer: false,
      }),
    ],
  },
};

const ensureArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const computeSummary = (sessions) => {
  const initial = {
    totalSessions: 0,
    fullyStaffed: 0,
    partiallyStaffed: 0,
    unstaffed: 0,
    totalRequiredExaminers: 0,
    totalAssignedExaminers: 0,
    totalCapacity: 0,
    totalBooked: 0,
  };

  return sessions.reduce((acc, session) => {
    const assignedCount = session.assignedExaminers?.length || 0;
    acc.totalSessions += 1;
    acc.totalRequiredExaminers += session.requiredExaminers || 0;
    acc.totalAssignedExaminers += assignedCount;
    acc.totalCapacity += session.capacity || 0;
    acc.totalBooked += session.bookedCount || 0;

    if (assignedCount === 0) acc.unstaffed += 1;
    else if (assignedCount < session.requiredExaminers) acc.partiallyStaffed += 1;
    else acc.fullyStaffed += 1;

    return acc;
  }, initial);
};

const computeCalendar = (sessions) => {
  return sessions.reduce((acc, session) => {
    const date = session.date;
    if (!acc[date]) {
      acc[date] = { fullyStaffed: 0, partialStaffed: 0, noStaffed: 0 };
    }
    const assignedCount = session.assignedExaminers?.length || 0;
    if (assignedCount === 0) acc[date].noStaffed += 1;
    else if (assignedCount < session.requiredExaminers) acc[date].partialStaffed += 1;
    else acc[date].fullyStaffed += 1;
    return acc;
  }, {});
};

const computeVenues = (sessions) => {
  const seen = new Map();
  sessions.forEach((session) => {
    if (!seen.has(session.venueId)) {
      seen.set(session.venueId, {
        id: session.venueId,
        name: session.venueName,
      });
    }
  });
  return Array.from(seen.values());
};

const matchesSearch = (session, searchTerm) => {
  if (!searchTerm) return true;
  const value = searchTerm.trim().toLowerCase();
  if (!value) return true;

  const venueMatch = session.venueName?.toLowerCase().includes(value);
  const examinerMatch = (session.assignedExaminers || [])
    .some((examiner) => examiner.name?.toLowerCase().includes(value));
  const studentMatch = (session.enrolledStudents || [])
    .some((student) => student.name?.toLowerCase().includes(value));
  const groupMatch = (session.enrolledGroups || [])
    .some((group) => group.name?.toLowerCase().includes(value));

  return venueMatch || examinerMatch || studentMatch || groupMatch;
};

const adminSchedulingReportServiceMock = {
  async getCalendar(assignmentId, month) {
    await delay();
    const key = String(assignmentId);
    const dataset = MOCK_ASSIGNMENTS[key];
    if (!dataset) {
      return { success: true, data: {} };
    }

    const calendar = computeCalendar(dataset.sessions);
    if (month) {
      const filtered = {};
      Object.entries(calendar).forEach(([date, value]) => {
        if (date.startsWith(month)) {
          filtered[date] = value;
        }
      });
      return { success: true, data: filtered };
    }

    return { success: true, data: calendar };
  },

  async getSessions(assignmentId, params = {}) {
    await delay();
    const key = String(assignmentId);
    const dataset = MOCK_ASSIGNMENTS[key];
    if (!dataset) {
      return {
        success: true,
        data: {
          sessions: [],
          summary: computeSummary([]),
          venues: [],
          outsideAssignmentRange: false,
        },
      };
    }

    const dates = ensureArray(params.date);
    const status = params.status && params.status !== "all" ? params.status : null;
    const venueId = params.venueId && params.venueId !== "all" ? params.venueId : null;
    const searchTerm = params.q || params.search || "";

    let sessions = dataset.sessions;

    if (dates.length > 0) {
      const lookup = new Set(dates);
      sessions = sessions.filter((session) => lookup.has(session.date));
    }

    if (status) {
      sessions = sessions.filter((session) => session.staffingStatus === status);
    }

    if (venueId) {
      sessions = sessions.filter((session) => session.venueId === venueId);
    }

    sessions = sessions.filter((session) => matchesSearch(session, searchTerm));

    const summary = computeSummary(sessions);
    const venues = computeVenues(dataset.sessions);

    return {
      success: true,
      data: {
        sessions,
        summary,
        venues,
        outsideAssignmentRange: false,
      },
    };
  },

  async getPublishStatus(assignmentId) {
    await delay(150);
    const dataset = MOCK_ASSIGNMENTS[String(assignmentId)];
    if (!dataset) {
      return { success: true, data: { examiners: false, students: false } };
    }
    return { success: true, data: { ...dataset.publish } };
  },

  async getAssignmentMeta(assignmentId) {
    await delay(150);
    const dataset = MOCK_ASSIGNMENTS[String(assignmentId)];
    if (!dataset) {
      return { success: false, data: null };
    }
    return { success: true, data: { ...dataset.meta } };
  },
};

export default adminSchedulingReportServiceMock;

