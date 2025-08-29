'use client';

/**
 * BulkActionsBar - Actions for selected time slots
 * Wired to deleteTimeSlots, duplicateTimeSlot, and "Notify" operations
 */

export default function BulkActionsBar({ 
  selectedCount = 0,
  onNotifyExaminers,
  onDuplicateSelected,
  onDeleteSelected,
  isProcessing = false
}) {
  
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="p-3 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg flex items-center justify-between animate-fade-in">
      <span className="text-sm font-medium text-blue-800 dark:text-blue-200 mr-2">
        <i className="fas fa-check-square mr-1.5" /> 
        {selectedCount} time slot{selectedCount > 1 ? 's' : ''} selected
      </span>
      <div className="flex items-center space-x-2">
        <button 
          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={onNotifyExaminers}
          disabled={isProcessing}
        >
          <i className="fas fa-envelope mr-1.5" /> 
          Notify Examiners
        </button>
        <button 
          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={onDuplicateSelected}
          disabled={isProcessing}
        >
          <i className="fas fa-copy mr-1.5" /> 
          Duplicate
        </button>
        <button 
          className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={onDeleteSelected}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5 inline-block"></div>
              Deleting...
            </>
          ) : (
            <>
              <i className="fas fa-trash-alt mr-1.5" />
              Delete
            </>
          )}
        </button>
      </div>
    </div>
  );
}