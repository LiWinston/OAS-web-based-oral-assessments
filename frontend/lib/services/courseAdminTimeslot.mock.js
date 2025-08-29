/**
 * Mock service implementation for Course Admin Timeslot management
 * Provides realistic mock data and responses for development and testing
 */

// Mock data storage
let mockSessionConfigs = {};
let mockTimeSlots = [
  {
    id: 1,
    date: '2025-08-15',
    startTime: '09:00',
    endTime: '10:30',
    venue: 'Engineering Building, Room 405',
    requiredExaminers: 2,
    sessionCount: 3,
    status: 'full',
    assignedExaminers: [
      { id: 1, name: 'Dr. Emma Thompson', email: 'emma.thompson@uni.edu' },
      { id: 2, name: 'Dr. Michael Chen', email: 'michael.chen@uni.edu' }
    ]
  },
  {
    id: 2,
    date: '2025-08-15',
    startTime: '11:00',
    endTime: '12:30',
    venue: 'Engineering Building, Room 405',
    requiredExaminers: 2,
    sessionCount: 3,
    status: 'partial',
    assignedExaminers: [
      { id: 1, name: 'Dr. Emma Thompson', email: 'emma.thompson@uni.edu' }
    ]
  },
  {
    id: 3,
    date: '2025-08-16',
    startTime: '14:00',
    endTime: '16:00',
    venue: 'ICT Building, Room 203',
    requiredExaminers: 2,
    sessionCount: 4,
    status: 'empty',
    assignedExaminers: []
  }
];

let mockExaminers = [
  { id: 1, name: 'Dr. Emma Thompson', email: 'emma.thompson@uni.edu', maxSessions: 40 },
  { id: 2, name: 'Dr. Michael Chen', email: 'michael.chen@uni.edu', maxSessions: 40 },
  { id: 3, name: 'Dr. Sarah Johnson', email: 'sarah.johnson@uni.edu', maxSessions: 40 },
  { id: 4, name: 'Prof. David Williams', email: 'david.williams@uni.edu', maxSessions: 40 }
];

let mockCalendarData = {};

// Utility functions
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => Math.max(...mockTimeSlots.map(s => s.id), 0) + 1;

const determineStatus = (assignedCount, requiredCount) => {
  if (assignedCount === 0) return 'empty';
  if (assignedCount < requiredCount) return 'partial';
  return 'full';
};

const updateTimeSlotStatus = (timeSlot) => {
  return {
    ...timeSlot,
    status: determineStatus(timeSlot.assignedExaminers.length, timeSlot.requiredExaminers)
  };
};

export const courseAdminTimeslotServiceMock = {
  /**
   * Get session configuration for an assignment
   */
  async getSessionConfig(assignmentId) {
    await delay();
    
    const config = mockSessionConfigs[assignmentId] || {
      assignmentId,
      sessionLength: 30,
      gapTime: 5,
      examinersPerSession: 2,
      isConfigured: false
    };

    return {
      success: true,
      data: config,
      message: 'Session configuration retrieved successfully'
    };
  },

  /**
   * Save session configuration
   */
  async saveSessionConfig(assignmentId, body) {
    await delay();
    
    mockSessionConfigs[assignmentId] = {
      assignmentId,
      ...body,
      isConfigured: true
    };

    return {
      success: true,
      data: mockSessionConfigs[assignmentId],
      message: 'Session configuration saved successfully'
    };
  },

  /**
   * Get calendar data for a specific month
   */
  async getCalendar(assignmentId, month) {
    await delay();
    
    // Generate calendar summary data
    const daysInMonth = new Date(month + '-01').getMonth() === 1 ? 28 : 31;
    const calendarData = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      const daySlots = mockTimeSlots.filter(slot => slot.date === dateStr);
      
      if (daySlots.length > 0) {
        const statuses = daySlots.map(slot => slot.status);
        let overallStatus = 'empty';
        
        if (statuses.every(s => s === 'full')) overallStatus = 'full';
        else if (statuses.some(s => s === 'partial' || s === 'full')) overallStatus = 'partial';
        
        calendarData[dateStr] = {
          slotCount: daySlots.length,
          status: overallStatus,
          totalSessions: daySlots.reduce((sum, slot) => sum + slot.sessionCount, 0)
        };
      }
    }

    return {
      success: true,
      data: calendarData,
      message: 'Calendar data retrieved successfully'
    };
  },

  /**
   * Create multiple time slots in batch
   */
  async createTimeSlotsBatch(assignmentId, { timeSlots }) {
    await delay();
    
    // Simulate conflict validation
    const conflicts = [];
    
    timeSlots.forEach(newSlot => {
      const existing = mockTimeSlots.find(existing => 
        existing.date === newSlot.date && 
        existing.venue === newSlot.venue &&
        existing.startTime === newSlot.startTime
      );
      
      if (existing) {
        conflicts.push(`Time slot conflict: ${newSlot.date} at ${newSlot.startTime} in ${newSlot.venue}`);
      }
    });

    if (conflicts.length > 0) {
      return {
        success: false,
        data: null,
        message: `Conflicts detected: ${conflicts.join(', ')}`,
        errors: conflicts
      };
    }

    // Add new time slots
    const createdSlots = timeSlots.map(slot => ({
      ...slot,
      id: generateId(),
      assignedExaminers: [],
      status: 'empty'
    }));

    mockTimeSlots.push(...createdSlots);

    return {
      success: true,
      data: createdSlots,
      message: `${createdSlots.length} time slots created successfully`
    };
  },

  /**
   * Get time slots with optional filtering
   */
  async getTimeSlots(assignmentId, filters = {}) {
    await delay();
    
    let filteredSlots = [...mockTimeSlots];
    
    if (filters.date) {
      filteredSlots = filteredSlots.filter(slot => slot.date === filters.date);
    }
    
    if (filters.status) {
      filteredSlots = filteredSlots.filter(slot => slot.status === filters.status);
    }

    return {
      success: true,
      data: filteredSlots,
      message: 'Time slots retrieved successfully'
    };
  },

  /**
   * Update a specific time slot
   */
  async updateTimeSlot(assignmentId, timeSlotId, body) {
    await delay();
    
    const index = mockTimeSlots.findIndex(slot => slot.id === timeSlotId);
    
    if (index === -1) {
      return {
        success: false,
        data: null,
        message: 'Time slot not found'
      };
    }

    // Update the time slot
    const updatedSlot = updateTimeSlotStatus({
      ...mockTimeSlots[index],
      ...body
    });
    
    mockTimeSlots[index] = updatedSlot;

    return {
      success: true,
      data: updatedSlot,
      message: 'Time slot updated successfully'
    };
  },

  /**
   * Delete multiple time slots
   */
  async deleteTimeSlots(assignmentId, ids) {
    await delay();
    
    const deletedCount = mockTimeSlots.length;
    mockTimeSlots = mockTimeSlots.filter(slot => !ids.includes(slot.id));
    const actualDeletedCount = deletedCount - mockTimeSlots.length;

    return {
      success: true,
      data: { deletedCount: actualDeletedCount },
      message: `${actualDeletedCount} time slots deleted successfully`
    };
  },

  /**
   * Duplicate a time slot
   */
  async duplicateTimeSlot(assignmentId, timeSlotId, body = {}) {
    await delay();
    
    const originalSlot = mockTimeSlots.find(slot => slot.id === timeSlotId);
    
    if (!originalSlot) {
      return {
        success: false,
        data: null,
        message: 'Time slot not found'
      };
    }

    // Create duplicate with new date if provided, otherwise increment by 1 day
    let newDate = body.date;
    if (!newDate) {
      const originalDate = new Date(originalSlot.date);
      originalDate.setDate(originalDate.getDate() + 1);
      newDate = originalDate.toISOString().split('T')[0];
    }

    const duplicatedSlot = {
      ...originalSlot,
      id: generateId(),
      date: newDate,
      assignedExaminers: [],
      status: 'empty'
    };

    mockTimeSlots.push(duplicatedSlot);

    return {
      success: true,
      data: duplicatedSlot,
      message: 'Time slot duplicated successfully'
    };
  },

  /**
   * Get examiners for assignment
   */
  async getExaminers(assignmentId) {
    await delay();
    
    return {
      success: true,
      data: mockExaminers,
      message: 'Examiners retrieved successfully'
    };
  },

  /**
   * Update examiner session limits
   */
  async updateExaminerLimits(assignmentId, limits) {
    await delay();
    
    // Update examiner limits in mock data
    limits.forEach(limit => {
      const examiner = mockExaminers.find(e => e.id === limit.examinerId);
      if (examiner) {
        examiner.maxSessions = limit.maxSessions;
      }
    });

    return {
      success: true,
      data: limits,
      message: 'Examiner limits updated successfully'
    };
  },

  /**
   * Get schedule status for release validation
   */
  async getScheduleStatus(assignmentId) {
    await delay();
    
    const totalSlots = mockTimeSlots.length;
    const fullyStaffedSlots = mockTimeSlots.filter(slot => slot.status === 'full').length;
    const partiallyStaffedSlots = mockTimeSlots.filter(slot => slot.status === 'partial').length;
    const unstaffedSlots = mockTimeSlots.filter(slot => slot.status === 'empty').length;

    const canRelease = unstaffedSlots === 0;

    return {
      success: true,
      data: {
        totalSlots,
        fullyStaffedSlots,
        partiallyStaffedSlots,
        unstaffedSlots,
        canRelease,
        issues: canRelease ? [] : ['Some time slots are not fully staffed']
      },
      message: 'Schedule status retrieved successfully'
    };
  },

  /**
   * Release schedule to students
   */
  async releaseSchedule(assignmentId, payload = {}) {
    await delay();
    
    const statusResponse = await this.getScheduleStatus(assignmentId);
    
    if (!statusResponse.data.canRelease) {
      return {
        success: false,
        data: null,
        message: 'Cannot release schedule: some time slots are not fully staffed',
        errors: statusResponse.data.issues
      };
    }

    return {
      success: true,
      data: {
        releasedAt: new Date().toISOString(),
        notifiedStudents: 25,
        totalTimeSlots: mockTimeSlots.length
      },
      message: 'Schedule released successfully. Students have been notified via email.'
    };
  }
};