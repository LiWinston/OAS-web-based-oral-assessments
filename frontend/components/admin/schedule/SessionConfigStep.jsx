'use client';

import { useEffect, useState } from 'react';
import { useSessionConfig } from '@/hooks/useSessionConfig.js';
import { showError } from '@/lib/notifications.js';
import { preventNumberInputScroll } from '@/lib/utils';

/**
 * SessionConfigStep - Step 1 of the schedule wizard
 * Reads/writes session configuration via useSessionConfig hook
 * 
 * @typedef {import('@/types/timeslot.js').SessionConfig} SessionConfig
 */

export default function SessionConfigStep({ assignmentId, onNext }) {
  const {
    data: config,
    isLoading,
    saveConfig,
    isSaving,
    sessionLength,
    gapTime,
    examinersPerSession
  } = useSessionConfig(assignmentId);

  // Local form state: only persist to backend when Next is pressed
  const [formSessionLength, setFormSessionLength] = useState(30);
  const [formGapTime, setFormGapTime] = useState(5);
  const [formExaminersPerSession, setFormExaminersPerSession] = useState(2);

  // Initialize local form from loaded config
  useEffect(() => {
    if (config) {
      setFormSessionLength(Number(config.sessionLength ?? 30));
      setFormGapTime(Number(config.gapTime ?? 5));
      setFormExaminersPerSession(Number(config.examinersPerSession ?? 2));
    }
  }, [config]);

  const handleNext = () => {
    // Validate step 1
    if (formSessionLength <= 0 || formGapTime < 0 || formExaminersPerSession <= 0) {
      showError('Please fill in all required fields with valid values');
      return;
    }

    // Save session config as specified in Section 8: "Next" on Step 1 → call saveSessionConfig
    const configData = {
      sessionLength: Number(formSessionLength),
      gapTime: Number(formGapTime),
      examinersPerSession: Number(formExaminersPerSession)
    };

    saveConfig(configData, {
      onSuccess: () => {
        onNext?.();
      }
    });
  };

  const handleSessionLengthChange = (newValue) => {
    setFormSessionLength(Number(newValue));
  };

  const handleGapTimeChange = (newValue) => {
    setFormGapTime(Number(newValue));
  };

  const handleExaminersPerSessionChange = (newValue) => {
    setFormExaminersPerSession(Number(newValue));
  };

  if (isLoading) {
    return (
      <div className="dashboard-card p-5 mb-6 animate-fade-in">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card p-5 mb-6 animate-fade-in">
      <div className="flex items-center mb-5">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 flex items-center justify-center mr-3">
          <i className="fas fa-sliders-h text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Timeslot Configuration</h2>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg border border-blue-100 dark:border-blue-800 mb-5">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <i className="fas fa-info-circle mr-2" /> Define the parameters for each oral assessment timeslot. These settings will apply to all timeslots created in the next step.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timeslot length */}
        <div className="card-section">
          <div className="card-section-header">
            <div className="card-section-icon icon-blue">
              <i className="fas fa-clock" />
            </div>
            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Timeslot Length</h3>
          </div>
          <div className="form-field">
            <label htmlFor="sessionLength" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Minutes per timeslot
              <span className="info-tooltip">
                <i className="fas fa-info-circle" />
                <span className="tooltip-text">How long each individual assessment timeslot will last</span>
              </span>
            </label>
            <div className="number-input-container">
              <button 
                className="number-btn" 
                onClick={() => handleSessionLengthChange(Math.max(1, formSessionLength - 5))} 
                title="Decrease timeslot length"
                disabled={isSaving}
              >
                <i className="fas fa-minus" />
              </button>
              <input
                type="number"
                id="sessionLength"
                className="number-input"
                min="1"
                step="5"
                value={formSessionLength}
                onChange={(e) => handleSessionLengthChange(Number(e.target.value) || 1)}
                onWheel={preventNumberInputScroll}
                disabled={isSaving}
              />
              <button 
                className="number-btn" 
                onClick={() => handleSessionLengthChange(formSessionLength + 5)} 
                title="Increase timeslot length"
                disabled={isSaving}
              >
                <i className="fas fa-plus" />
              </button>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">minutes</span>
            </div>
            <p className="helper-text">Recommended: 15-30 minutes depending on assessment complexity</p>
          </div>
        </div>

        {/* Gap time */}
        <div className="card-section">
          <div className="card-section-header">
            <div className="card-section-icon icon-purple">
              <i className="fas fa-hourglass-half" />
            </div>
            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Gap Time</h3>
          </div>
          <div className="form-field">
            <label htmlFor="gapTime" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Minutes between timeslots
              <span className="info-tooltip">
                <i className="fas fa-info-circle" />
                <span className="tooltip-text">Time between consecutive timeslots for examiners to prepare</span>
              </span>
            </label>
            <div className="number-input-container">
              <button 
                className="number-btn" 
                onClick={() => handleGapTimeChange(Math.max(0, formGapTime - 1))} 
                title="Decrease gap time"
                disabled={isSaving}
              >
                <i className="fas fa-minus" />
              </button>
              <input
                type="number"
                id="gapTime"
                className="number-input"
                min="0"
                step="1"
                value={formGapTime}
                onChange={(e) => handleGapTimeChange(Number(e.target.value) || 0)}
                onWheel={preventNumberInputScroll}
                disabled={isSaving}
              />
              <button 
                className="number-btn" 
                onClick={() => handleGapTimeChange(formGapTime + 1)} 
                title="Increase gap time"
                disabled={isSaving}
              >
                <i className="fas fa-plus" />
              </button>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">minutes</span>
            </div>
            <p className="helper-text">Recommended: 5-10 minutes for note-taking and transition</p>
          </div>
        </div>

        {/* Examiners count */}
        <div className="card-section">
          <div className="card-section-header">
            <div className="card-section-icon icon-green">
              <i className="fas fa-user-tie" />
            </div>
          <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Examiners</h3>
          </div>
          <div className="form-field">
            <label htmlFor="examinersCount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Examiners per timeslot
              <span className="info-tooltip">
                <i className="fas fa-info-circle" />
                <span className="tooltip-text">Number of examiners required for each assessment timeslot</span>
              </span>
            </label>
            <div className="number-input-container">
              <button 
                className="number-btn" 
                onClick={() => handleExaminersPerSessionChange(Math.max(1, formExaminersPerSession - 1))} 
                title="Decrease examiner count"
                disabled={isSaving}
              >
                <i className="fas fa-minus" />
              </button>
              <input
                type="number"
                id="examinersCount"
                className="number-input"
                min="1"
                step="1"
                value={formExaminersPerSession}
                onChange={(e) => handleExaminersPerSessionChange(Number(e.target.value) || 1)}
                onWheel={preventNumberInputScroll}
                disabled={isSaving}
              />
              <button 
                className="number-btn" 
                onClick={() => handleExaminersPerSessionChange(formExaminersPerSession + 1)} 
                title="Increase examiner count"
                disabled={isSaving}
              >
                <i className="fas fa-plus" />
              </button>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">examiners</span>
            </div>
            <p className="helper-text">Recommended: 2 examiners for balanced assessment</p>
          </div>
        </div>

        {/* Timeslot summary */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg" style={{ height: '185px' }}>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Timeslot Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Timeslot duration:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formSessionLength} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Gap between timeslots:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formGapTime} minutes</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total time per timeslot:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{Number(formSessionLength) + Number(formGapTime)} minutes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button 
          onClick={handleNext} 
          className="btn btn-primary"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>Next</span>
              <i className="fas fa-arrow-right ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
