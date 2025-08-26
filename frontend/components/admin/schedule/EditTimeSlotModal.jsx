'use client';

import AddTimeSlotModal from './AddTimeSlotModal';

/**
 * Thin wrapper around AddTimeSlotModal for explicit naming.
 */
export default function EditTimeSlotModal(props) {
  return <AddTimeSlotModal {...props} mode="edit" />;
}