const sanitize = (value) => (value || "").trim();

const buildLocationLabel = (venue) => {
  if (!venue) return "";
  const parts = [];
  if (venue.room) parts.push(`Room ${sanitize(venue.room)}`);
  if (venue.name && !parts.length) parts.push(sanitize(venue.name));
  const building = [venue.building, venue.campus, venue.address]
    .map((part) => sanitize(part))
    .filter(Boolean)
    .join(", ");
  if (building) parts.push(building);
  return parts.filter(Boolean).join(" — ");
};

const formatPolicyLine = (booking) => {
  const policies = [];
  if (booking.reschedulingEnabled !== undefined) {
    policies.push(
      `Rescheduling: ${booking.reschedulingEnabled ? "Allowed" : "Not allowed"}`
    );
  }
  if (booking.lockoutEnabled && typeof booking.lockoutWindowHours === "number") {
    policies.push(`Lockout window: ${booking.lockoutWindowHours} hours`);
  }
  if (booking.bookingDeadline) {
    const deadline = new Date(booking.bookingDeadline);
    if (!Number.isNaN(deadline.getTime())) {
      policies.push(
        `Booking deadline: ${deadline.toLocaleString("en-AU", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`
      );
    }
  }
  return policies.join(" · ");
};

export const bookingToCalendarEvent = (booking, { origin } = {}) => {
  if (!booking) return null;
  const session = booking.session || {};
  if (!session.start || !session.end) return null;

  const summaryParts = [
    booking.courseCode,
    booking.assignmentName || booking.assignmentId,
  ].filter(Boolean);

  const descriptionLines = [];
  if (booking.courseName) {
    descriptionLines.push(`Course: ${booking.courseName}`);
  }
  if (booking.assignmentName) {
    descriptionLines.push(`Assessment: ${booking.assignmentName}`);
  }
  if (booking.entity?.type) {
    descriptionLines.push(
      `Booking type: ${booking.entity.type === "GROUP" ? "Group" : "Individual"}`
    );
  }
  const policyLine = formatPolicyLine(booking);
  if (policyLine) descriptionLines.push(policyLine);
  if (session.venue?.room && /^https?:\/\//i.test(session.venue.room)) {
    descriptionLines.push(`Venue map: ${session.venue.room}`);
  }
  const link = origin
    ? `${origin}/student/booking/${booking.assignmentId}/confirmation`
    : null;
  if (link) {
    descriptionLines.push(`Manage booking: ${link}`);
  }

  return {
    uid: `booking-${booking.bookingId || booking.assignmentId}-${session.start}`,
    start: session.start,
    end: session.end,
    summary: summaryParts.join(" · ") || "Assessment Booking",
    location: buildLocationLabel(session.venue),
    description: descriptionLines.join("\n"),
    status: "CONFIRMED",
  };
};

export const buildBookingEmailContent = (booking, { origin } = {}) => {
  if (!booking) return { subject: "", body: "" };
  const session = booking.session || {};
  const start = session.start ? new Date(session.start) : null;
  const end = session.end ? new Date(session.end) : null;
  const formatTime = (date) =>
    date && !Number.isNaN(date.getTime())
      ? `${date.toLocaleDateString("en-AU", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })} ${date.toLocaleTimeString("en-AU", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}`
      : "";

  const subjectParts = [
    "Assessment booking",
    booking.courseCode,
    booking.assignmentName,
  ].filter(Boolean);

  const lines = [
    "Here are my assessment booking details:",
    "",
  ];

  if (booking.assignmentName) {
    lines.push(`Assessment: ${booking.assignmentName}`);
  }
  if (booking.courseCode) {
    lines.push(`Course: ${booking.courseCode}${booking.courseName ? ` – ${booking.courseName}` : ""}`);
  }
  if (start) {
    lines.push(`Starts: ${formatTime(start)}`);
  }
  if (end) {
    lines.push(`Ends: ${formatTime(end)}`);
  }
  if (session.venue) {
    lines.push(`Location: ${buildLocationLabel(session.venue)}`);
  }
  if (booking.entity?.type) {
    lines.push(`Booking type: ${booking.entity.type === "GROUP" ? "Group" : "Individual"}`);
  }

  const policyLine = formatPolicyLine(booking);
  if (policyLine) lines.push(`Policies: ${policyLine}`);

  if (origin) {
    lines.push("");
    lines.push(
      `Manage booking: ${origin}/student/booking/${booking.assignmentId}/confirmation`
    );
  }

  lines.push("");
  lines.push(
    "An .ics calendar file is attached for easy import into your calendar (or download it from OAS if not attached)."
  );

  return {
    subject: subjectParts.join(" · "),
    body: lines.join("\n"),
  };
};

