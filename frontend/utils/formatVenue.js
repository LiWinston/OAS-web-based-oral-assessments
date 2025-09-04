export function formatVenue(venue) {
  if (!venue) return '';
  const parts = [];
  if (venue.building) parts.push(venue.building);
  if (venue.room) parts.push(venue.room);
  if (venue.name) parts.push(venue.name);
  if (venue.venueName && !venue.name) parts.push(venue.venueName);
  if (parts.length === 0 && (venue.id || venue.venueId)) parts.push(`Venue #${venue.id || venue.venueId}`);
  return parts.join(' ');
}

export default formatVenue;

