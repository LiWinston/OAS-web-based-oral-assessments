const pad = (value) => String(value).padStart(2, "0");

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const asDate = new Date(value);
  return Number.isNaN(asDate.getTime()) ? null : asDate;
};

const toICSDate = (value) => {
  const date = toDate(value);
  if (!date) return null;
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
    date.getUTCDate()
  )}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
    date.getUTCSeconds()
  )}Z`;
};

const escapeICSValue = (value = "") =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");

const foldLine = (line) => {
  if (!line) return "";
  const maxLength = 75;
  if (line.length <= maxLength) return line;
  const segments = [];
  let index = 0;
  while (index < line.length) {
    segments.push(line.slice(index, index + maxLength));
    index += maxLength;
  }
  return segments.join("\r\n ");
};

const buildEventLines = (event) => {
  const dtStart = toICSDate(event.start);
  const dtEnd = toICSDate(event.end);
  if (!dtStart || !dtEnd) return [];

  const uid = event.uid || `${dtStart}-${dtEnd}-${Math.random().toString(36).slice(2)}@oas`;
  const lines = ["BEGIN:VEVENT"];
  lines.push(foldLine(`UID:${escapeICSValue(uid)}`));
  lines.push(foldLine(`DTSTAMP:${toICSDate(new Date())}`));
  lines.push(foldLine(`DTSTART:${dtStart}`));
  lines.push(foldLine(`DTEND:${dtEnd}`));

  if (event.summary) {
    lines.push(foldLine(`SUMMARY:${escapeICSValue(event.summary)}`));
  }
  if (event.location) {
    lines.push(foldLine(`LOCATION:${escapeICSValue(event.location)}`));
  }
  if (event.description) {
    lines.push(foldLine(`DESCRIPTION:${escapeICSValue(event.description)}`));
  }
  if (event.url) {
    lines.push(foldLine(`URL:${escapeICSValue(event.url)}`));
  }
  if (event.status) {
    lines.push(foldLine(`STATUS:${escapeICSValue(event.status)}`));
  } else {
    lines.push("STATUS:CONFIRMED");
  }
  lines.push("END:VEVENT");
  return lines;
};

export const createICSBlob = (events = [], options = {}) => {
  const list = Array.isArray(events) ? events : [events];
  const calendarName =
    options.calendarName || "OAS Assessment Bookings";
  const prodId = options.prodId || "-//OAS//Bookings//EN";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${escapeICSValue(prodId)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeICSValue(calendarName)}`),
  ];

  list.forEach((event) => {
    buildEventLines(event).forEach((line) => lines.push(line));
  });

  lines.push("END:VCALENDAR");

  return new Blob([lines.join("\r\n")], {
    type: "text/calendar;charset=utf-8",
  });
};

export const createICSFile = (
  events,
  { fileName = "event.ics", ...options } = {}
) => {
  const blob = createICSBlob(events, options);
  if (typeof File !== "undefined") {
    return new File([blob], fileName, { type: "text/calendar;charset=utf-8" });
  }
  blob.name = fileName;
  return blob;
};

export const triggerICSDownload = (blobOrFile, fileName = "event.ics") => {
  if (
    !blobOrFile ||
    typeof document === "undefined" ||
    typeof URL === "undefined"
  )
    return;
  const url = URL.createObjectURL(blobOrFile);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
