'use client';

import { createStatusPillData } from '../../../lib/mappers/timeslotMappers';

/**
 * StatusPill - Standardized status display component
 * Uses centralized status mapping from timeslotMappers
 * 
 * @typedef {import('../../../lib/types/timeslot.js').TimeSlot} TimeSlot
 */

export default function StatusPill({ status, assigned, required, timeSlot }) {
  // If timeSlot object is provided, use it; otherwise create from individual props
  const pillData = timeSlot 
    ? createStatusPillData(timeSlot)
    : createStatusPillData({ 
        assignedExaminers: new Array(assigned || 0).fill({}), 
        requiredExaminers: required || 0,
        status 
      });

  return (
    <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${pillData.className}`}>
      {pillData.text}
    </span>
  );
}