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

const SAMPLE_EXAMINERS = [
  { id: 101, name: "Prof. Anita Rao" },
  { id: 102, name: "Dr. Miguel Hernandez" },
  { id: 103, name: "Dr. Fiona Collins" },
  { id: 104, name: "Dr. Kelvin Wang" },
  { id: 105, name: "Prof. Minh Nguyen" },
  { id: 106, name: "Dr. Lila Banerjee" },
];

const SAMPLE_STUDENTS = [
  "Aaron Blair",
  "Bethany Gill",
  "Chen Rui",
  "Diana Marsh",
  "Evelyn Brooks",
  "Farid Khan",
  "Gina Hassan",
  "Henry Cole",
  "Iris Yamamoto",
  "Jared Fox",
];

const createSyntheticSessions = (assignmentId, { startDate, days, baseId = 9000 }) => {
  const dataset = MOCK_ASSIGNMENTS[assignmentId];
  if (!dataset) return;

  const venues = [
    { id: "VEN-ENG405", name: "ENG 405", required: 2, capacity: 2 },
    { id: "VEN-ENG410", name: "ENG 410", required: 1, capacity: 1 },
    { id: "VEN-ENG420", name: "ENG 420", required: 3, capacity: 2 },
  ];

  const baseDate = new Date(startDate);
  if (Number.isNaN(baseDate.getTime())) return;

  const sessions = [];
  for (let day = 0; day < days; day += 1) {
    const dateObj = new Date(baseDate.getTime());
    dateObj.setDate(baseDate.getDate() + day);
    const dateKey = dateObj.toISOString().split("T")[0];

    venues.forEach((venue, index) => {
      const sessionId = baseId + day * 10 + index;
      const capacity = venue.capacity + (day % 2 === 0 ? 0 : 1);
      const booked = Math.min(capacity, ((day + 1) * (index + 1)) % (capacity + 1));
      const required = venue.required;
      const assignedCount = Math.max(0, Math.min(required, ((day + index) % (required + 1))));

      const assignedExaminers = SAMPLE_EXAMINERS.slice(0, assignedCount);
      const enrolledStudents = Array.from({ length: booked }).map((_, studentIndex) => ({
        id: `${sessionId}-${studentIndex}`,
        name: SAMPLE_STUDENTS[(day + studentIndex + index) % SAMPLE_STUDENTS.length],
      }));

      const startHour = String(9 + index).padStart(2, "0");
      const endHour = String(9 + index).padStart(2, "0");
      const startMinute = day % 2 === 0 ? "00" : "30";
      const endMinute = day % 2 === 0 ? "25" : "55";

      sessions.push(makeSession({
        id: sessionId,
        date: dateKey,
        startTime: `${startHour}:${startMinute}`,
        endTime: `${endHour}:${endMinute}`,
        venueId: venue.id,
        venueName: venue.name,
        capacity,
        bookedCount: booked,
        requiredExaminers: required,
        assignedExaminers,
        enrolledStudents,
        publishedToExaminer: day % 3 !== 0,
        publishedToStudent: day % 4 === 0,
      }));
    });
  }

  dataset.sessions = [...dataset.sessions, ...sessions];
  dataset.sessions.sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return (a.startTime || "").localeCompare(b.startTime || "");
  });
  updateDatasetWindow(dataset);
};

const updateDatasetWindow = (dataset) => {
  if (!dataset?.sessions?.length) return;
  const sortedDates = dataset.sessions.map((session) => session.date).sort();
  const minDate = sortedDates[0];
  const maxDate = sortedDates[sortedDates.length - 1];
  if (!dataset.meta) {
    dataset.meta = {};
  }
  dataset.meta.windowStart = dataset.meta.windowStart
    ? (dataset.meta.windowStart < minDate ? dataset.meta.windowStart : minDate)
    : minDate;
  dataset.meta.windowEnd = dataset.meta.windowEnd
    ? (dataset.meta.windowEnd > maxDate ? dataset.meta.windowEnd : maxDate)
    : maxDate;
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

createSyntheticSessions("42", { startDate: "2025-09-18", days: 7, baseId: 4300 });
createSyntheticSessions("77", { startDate: "2025-10-04", days: 6, baseId: 7800 });

const ensureDataset = (assignmentId) => {
  const key = String(assignmentId);
  if (!MOCK_ASSIGNMENTS[key]) {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const end = new Date(start.getTime());
    end.setDate(start.getDate() + 9);

    const startKey = start.toISOString().split("T")[0];
    const endKey = end.toISOString().split("T")[0];
    const numericId = Number.parseInt(String(assignmentId).replace(/[^0-9]/g, ""), 10);
    const baseId = Number.isFinite(numericId) ? numericId * 100 : 6000;

    MOCK_ASSIGNMENTS[key] = {
      meta: {
        id: assignmentId,
        name: `Mock Assignment ${assignmentId}`,
        courseName: "Mock Course",
        courseCode: `MCK${String(assignmentId).padStart(3, "0")}`,
        windowStart: startKey,
        windowEnd: endKey,
        timezone: "Australia/Melbourne",
      },
      publish: { examiners: true, students: false },
      sessions: [],
    };
    createSyntheticSessions(key, { startDate: startKey, days: 10, baseId });
  }
  return MOCK_ASSIGNMENTS[key];
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
    const dataset = ensureDataset(assignmentId);
    await delay();
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
    const dataset = ensureDataset(assignmentId);
    await delay();

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
    ensureDataset(assignmentId);
    await delay(150);
    const dataset = MOCK_ASSIGNMENTS[String(assignmentId)];
    return { success: true, data: { ...dataset.publish } };
  },

  async getAssignmentMeta(assignmentId) {
    await delay(150);
    const dataset = ensureDataset(assignmentId);
    return { success: true, data: { ...dataset.meta } };
  },
};

export default adminSchedulingReportServiceMock;
