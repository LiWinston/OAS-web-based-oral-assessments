import React from 'react';

function formatTime(isoString, timezone = 'Australia/Melbourne') {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-AU', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function TimeslotList({
  isLoading,
  error,
  onRetry,
  timeSlots = [],
  selectedDate,
  onToggleSlot,
  isSlotSelected,
  selectionMessage,
  showWithdrawal = false,
  onWithdraw,
  isWithdrawing = false,
}) {
  // Check if withdrawal is allowed for a slot
  const canWithdrawFromSlot = (slot) => {
    if (!slot.isAssigned) return false;
    // Based on API contract: can only withdraw when bookingCount === 0
    return slot.bookingCount === 0;
  };

  // Get tooltip text for withdrawal button
  const getWithdrawalTooltip = (slot) => {
    if (!slot.isAssigned) {
      return 'Not assigned to this slot';
    }
    if (slot.bookingCount > 0) {
      return 'Cannot withdraw: Students are already booked';
    }
    return 'Click to withdraw from this timeslot';
  };

  const slotsForDate = timeSlots.filter((slot) => {
    const slotDate = new Date(slot.start).toISOString().split('T')[0];
    return slotDate === selectedDate;
  });

  if (!selectedDate) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-calendar-day text-gray-400 dark:text-gray-500 text-2xl"></i>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Select a date from the calendar to view available time slots</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          <i className="fas fa-clock text-blue-600 dark:text-blue-400 mr-2"></i>
          Available Slots - {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </h2>
        {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>}
      </div>

      {selectionMessage && (
        <div className={`p-3 rounded mb-3 text-sm ${selectionMessage.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-200'}`}>
          <i className={`fas ${selectionMessage.type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'} mr-2`}></i>
          {selectionMessage.text}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading timeslots...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-800 dark:text-red-200 mb-6">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          Failed to load timeslots.
          {onRetry && (
            <button onClick={onRetry} className="underline hover:no-underline ml-1">Try again</button>
          )}
        </div>
      )}

      {!error && (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {slotsForDate.map((slot) => {
            const canSelect = slot.availability?.canSelect;
            const reason = slot.availability?.reason;
            const selected = isSlotSelected(slot.slotId);
            return (
              <div
                key={slot.slotId}
                className={`p-3 border rounded-lg transition-colors ${
                  !canSelect && !showWithdrawal
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                    : selected
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 cursor-pointer'
                    : slot.isAssigned && showWithdrawal
                    ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                }`}
                onClick={() => canSelect && !showWithdrawal && onToggleSlot(slot)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{formatTime(slot.start)} - {formatTime(slot.end)}</span>
                      {slot.isAssigned && showWithdrawal && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          <i className="fas fa-check mr-1"></i>Assigned
                        </span>
                      )}
                      {!canSelect && reason && !showWithdrawal && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                          {reason === 'SLOT_FULL' ? 'Full' : reason === 'TIME_CONFLICT' ? 'Conflict' : reason}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      {slot.venue?.building} {slot.venue?.room} - {slot.venue?.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div>
                        {slot.currentExaminers}/{slot.requiredExaminers} examiners assigned
                      </div>
                      {slot.isAssigned && showWithdrawal && typeof slot.bookingCount !== 'undefined' && (
                        <div className={`${slot.bookingCount > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                          <i className={`fas ${slot.bookingCount > 0 ? 'fa-users' : 'fa-user-slash'} mr-1`}></i>
                          {slot.bookingCount} student{slot.bookingCount !== 1 ? 's' : ''} booked
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      slot.sessionCount === 1
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : slot.sessionCount === 2
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                    }`}>
                      {slot.sessionCount} session{slot.sessionCount !== 1 ? 's' : ''}
                    </span>
                    
                    {/* Show withdrawal button if in withdrawal mode */}
                    {showWithdrawal && slot.isAssigned && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onWithdraw?.(slot);
                        }}
                        disabled={!canWithdrawFromSlot(slot) || isWithdrawing}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          canWithdrawFromSlot(slot) && !isWithdrawing
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        }`}
                        title={getWithdrawalTooltip(slot)}
                      >
                        {isWithdrawing ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-times mr-1"></i>
                        )}
                        Withdraw
                      </button>
                    )}
                    
                    {/* Show selection checkbox if in selection mode */}
                    {canSelect && !showWithdrawal && (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                        {selected && <i className="fas fa-check text-white text-xs"></i>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {slotsForDate.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-calendar-times text-gray-400 dark:text-gray-500 text-2xl"></i>
              </div>
              <p className="text-gray-600 dark:text-gray-400">No timeslots available for this date</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

