const DEFAULT_OPTIONS = {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
};

export function formatDateRangeWithTimezone(startISO, endISO, timezone) {
  if (!startISO) return "Schedule pending";

  try {
    const start = new Date(startISO);
    const end = endISO ? new Date(endISO) : null;

    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      ...DEFAULT_OPTIONS,
      timeZone: timezone,
    });

    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone,
    });

    const dateLabel = dateFormatter.format(start);
    const startLabel = timeFormatter.format(start);
    const endLabel = end ? timeFormatter.format(end) : null;

    if (endLabel) {
      return `${dateLabel} · ${startLabel} – ${endLabel}`;
    }

    return `${dateLabel} · ${startLabel}`;
  } catch (error) {
    return "Schedule pending";
  }
}

const datetimeUtils = {
  formatDateRangeWithTimezone,
};

export default datetimeUtils;
