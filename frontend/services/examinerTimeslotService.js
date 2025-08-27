import { apiClient } from './apiClient';

// Mock data for development - will be replaced with real API calls
// Generate dates relative to current date for realistic testing
const getDateOffset = (days, hours = 9, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

const mockAssignments = [
  {
    assignmentId: 101,
    assignmentName: "Project Proposal Presentation",
    courseCode: "COMP90082",
    courseName: "Software Project Management",
    assessmentType: "GROUP",
    sessionDurationMinutes: 30,
    requiredExaminers: 2,
    availableTimeslots: 8,
    earliestTimeslot: getDateOffset(2, 9, 0),
    latestTimeslot: getDateOffset(4, 17, 0),
    examinerInfo: {
      maxSessions: 12,
      currentAssignedSessions: 2,
      remainingCapacity: 10
    },
    signupDeadline: getDateOffset(1, 17, 0),
    status: "open",
    urgency: "high"
  },
  {
    assignmentId: 102,
    assignmentName: "Mid-Semester Project Update",
    courseCode: "INFO30005",
    courseName: "Web Information Technologies",
    assessmentType: "GROUP",
    sessionDurationMinutes: 25,
    requiredExaminers: 2,
    availableTimeslots: 6,
    earliestTimeslot: getDateOffset(3, 10, 0),
    latestTimeslot: getDateOffset(5, 16, 0),
    examinerInfo: {
      maxSessions: 12,
      currentAssignedSessions: 4,
      remainingCapacity: 8
    },
    signupDeadline: getDateOffset(2, 17, 0),
    status: "open",
    urgency: "medium"
  },
  {
    assignmentId: 103,
    assignmentName: "Individual Technical Interview",
    courseCode: "INFO20003",
    courseName: "Database Systems",
    assessmentType: "INDIVIDUAL",
    sessionDurationMinutes: 15,
    requiredExaminers: 1,
    availableTimeslots: 12,
    earliestTimeslot: getDateOffset(5, 9, 0),
    latestTimeslot: getDateOffset(10, 17, 0),
    examinerInfo: {
      maxSessions: 12,
      currentAssignedSessions: 1,
      remainingCapacity: 11
    },
    signupDeadline: getDateOffset(3, 17, 0),
    status: "open",
    urgency: "low"
  },
  {
    assignmentId: 104,
    assignmentName: "Final Project Defense",
    courseCode: "COMP90018",
    courseName: "Mobile Computing Systems",
    assessmentType: "GROUP",
    sessionDurationMinutes: 45,
    requiredExaminers: 3,
    availableTimeslots: 0,
    earliestTimeslot: getDateOffset(7, 9, 0),
    latestTimeslot: getDateOffset(9, 17, 0),
    examinerInfo: {
      maxSessions: 12,
      currentAssignedSessions: 6,
      remainingCapacity: 6
    },
    signupDeadline: getDateOffset(5, 17, 0),
    status: "full",
    urgency: "high"
  },
  {
    assignmentId: 105,
    assignmentName: "Research Methodology Oral Exam",
    courseCode: "COMP90049",
    courseName: "Introduction to Machine Learning",
    assessmentType: "INDIVIDUAL",
    sessionDurationMinutes: 20,
    requiredExaminers: 2,
    availableTimeslots: 15,
    earliestTimeslot: getDateOffset(6, 9, 0),
    latestTimeslot: getDateOffset(12, 16, 0),
    examinerInfo: {
      maxSessions: 12,
      currentAssignedSessions: 0,
      remainingCapacity: 12
    },
    signupDeadline: getDateOffset(4, 17, 0),
    status: "open",
    urgency: "medium"
  },
  {
    assignmentId: 106,
    assignmentName: "System Design Review",
    courseCode: "SWEN90007",
    courseName: "Software Design and Architecture",
    assessmentType: "GROUP",
    sessionDurationMinutes: 40,
    requiredExaminers: 2,
    availableTimeslots: 4,
    earliestTimeslot: getDateOffset(8, 10, 0),
    latestTimeslot: getDateOffset(11, 15, 0),
    examinerInfo: {
      maxSessions: 12,
      currentAssignedSessions: 3,
      remainingCapacity: 9
    },
    signupDeadline: getDateOffset(6, 17, 0),
    status: "open",
    urgency: "high"
  },
  {
    assignmentId: 107,
    assignmentName: "Algorithm Analysis Presentation",
    courseCode: "COMP90038",
    courseName: "Algorithms and Complexity",
    assessmentType: "INDIVIDUAL",
    sessionDurationMinutes: 25,
    requiredExaminers: 1,
    availableTimeslots: 0,
    earliestTimeslot: getDateOffset(-2, 9, 0),
    latestTimeslot: getDateOffset(-1, 17, 0),
    examinerInfo: {
      maxSessions: 12,
      currentAssignedSessions: 5,
      remainingCapacity: 7
    },
    signupDeadline: getDateOffset(-3, 17, 0),
    status: "deadline_passed",
    urgency: "low"
  }
];

// Generate realistic schedule data with current dates
const generateScheduleSlot = (id, assignmentInfo, dayOffset, hour, minute, duration, participants, isBooked = true) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + dayOffset);
  startDate.setHours(hour, minute, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + duration);
  
  const venues = [
    { name: "Engineering", building: "ENG", room: "405" },
    { name: "ICT", building: "ICT", room: "203" },
    { name: "Science", building: "SCI", room: "B201" },
    { name: "Commerce", building: "COM", room: "G15" },
    { name: "FBE", building: "FBE", room: "310" },
    { name: "Law", building: "LAW", room: "104" }
  ];
  
  return {
    slotId: id,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    venue: venues[Math.floor(Math.random() * venues.length)],
    sessionCount: 1,
    requiredExaminers: assignmentInfo.requiredExaminers,
    currentExaminers: assignmentInfo.requiredExaminers,
    isBooked,
    bookingCount: isBooked ? 1 : 0,
    canWithdraw: dayOffset > 1, // Can withdraw if more than 1 day away
    withdrawalDeadline: getDateOffset(dayOffset - 1, 17, 0),
    participants: isBooked ? participants : []
  };
};

const mockScheduleData = {
  assignments: [
    {
      assignmentId: 101,
      assignmentName: "Project Proposal Presentation",
      courseCode: "COMP90082",
      courseName: "Software Project Management",
      slots: [
        // Today's assessments
        generateScheduleSlot(5001, {requiredExaminers: 2}, 0, 9, 30, 30, ["Team Alpha"], true),
        generateScheduleSlot(5002, {requiredExaminers: 2}, 0, 14, 0, 30, ["Team Beta"], true),
        generateScheduleSlot(5003, {requiredExaminers: 2}, 0, 16, 0, 30, ["Team Gamma"], true),
        
        // Tomorrow's assessments  
        generateScheduleSlot(5004, {requiredExaminers: 2}, 1, 10, 0, 30, ["Team Delta"], true),
        generateScheduleSlot(5005, {requiredExaminers: 2}, 1, 13, 30, 30, ["Team Echo"], true),
        
        // Next few days
        generateScheduleSlot(5006, {requiredExaminers: 2}, 2, 11, 0, 30, ["Team Foxtrot"], true),
        generateScheduleSlot(5007, {requiredExaminers: 2}, 3, 15, 30, 30, ["Team Golf"], true),
        generateScheduleSlot(5008, {requiredExaminers: 2}, 4, 9, 0, 30, [], false),
      ]
    },
    {
      assignmentId: 102,
      assignmentName: "Mid-Semester Project Update",
      courseCode: "INFO30005",
      courseName: "Web Information Technologies",
      slots: [
        generateScheduleSlot(5009, {requiredExaminers: 2}, 1, 11, 30, 25, ["WebDev Team 1"], true),
        generateScheduleSlot(5010, {requiredExaminers: 2}, 2, 14, 0, 25, ["WebDev Team 2"], true),
        generateScheduleSlot(5011, {requiredExaminers: 2}, 5, 10, 30, 25, ["WebDev Team 3"], true),
        generateScheduleSlot(5012, {requiredExaminers: 2}, 6, 16, 0, 25, [], false),
      ]
    },
    {
      assignmentId: 103,
      assignmentName: "Individual Technical Interview",
      courseCode: "INFO20003",
      courseName: "Database Systems",
      slots: [
        generateScheduleSlot(5013, {requiredExaminers: 1}, 3, 9, 15, 15, ["Alice Chen"], true),
        generateScheduleSlot(5014, {requiredExaminers: 1}, 3, 9, 30, 15, ["Bob Smith"], true),
        generateScheduleSlot(5015, {requiredExaminers: 1}, 3, 9, 45, 15, ["Carol Johnson"], true),
        generateScheduleSlot(5016, {requiredExaminers: 1}, 4, 13, 0, 15, ["David Wilson"], true),
        generateScheduleSlot(5017, {requiredExaminers: 1}, 4, 13, 15, 15, ["Emma Davis"], true),
        generateScheduleSlot(5018, {requiredExaminers: 1}, 7, 10, 0, 15, [], false),
      ]
    },
    {
      assignmentId: 105,
      assignmentName: "Research Methodology Oral Exam",
      courseCode: "COMP90049",
      courseName: "Introduction to Machine Learning",
      slots: [
        generateScheduleSlot(5019, {requiredExaminers: 2}, 6, 11, 0, 20, ["Frank Miller"], true),
        generateScheduleSlot(5020, {requiredExaminers: 2}, 7, 14, 30, 20, ["Grace Lee"], true),
        generateScheduleSlot(5021, {requiredExaminers: 2}, 8, 9, 30, 20, [], false),
      ]
    },
    {
      assignmentId: 106,
      assignmentName: "System Design Review",
      courseCode: "SWEN90007",
      courseName: "Software Design and Architecture",
      slots: [
        generateScheduleSlot(5022, {requiredExaminers: 2}, 8, 13, 0, 40, ["Architecture Team 1"], true),
        generateScheduleSlot(5023, {requiredExaminers: 2}, 9, 10, 30, 40, ["Architecture Team 2"], true),
        generateScheduleSlot(5024, {requiredExaminers: 2}, 11, 15, 0, 40, [], false),
      ]
    }
  ]
};

// Add realistic delays for development
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get assignments available to examiner for self-assignment
 * Aligns with GET /api/examiners/{examinerId}/assignments
 */
export const getAvailableAssignments = async (examinerId, options = {}) => {
  const { courseId, pageNum = 0, pageSize = 20, sort = 'date_asc' } = options;
  
  
  try {
    await delay(Math.random() * 1000 + 500); // 500-1500ms delay
    
    // Filter assignments based on query params
    let filteredAssignments = [...mockAssignments];
    
    if (courseId) {
      filteredAssignments = filteredAssignments.filter(assignment => 
        assignment.courseCode === courseId
      );
    }
    
    // Sort assignments
    if (sort === 'date_desc') {
      filteredAssignments.sort((a, b) => 
        new Date(b.earliestTimeslot) - new Date(a.earliestTimeslot)
      );
    } else {
      filteredAssignments.sort((a, b) => 
        new Date(a.earliestTimeslot) - new Date(b.earliestTimeslot)
      );
    }
    
    // Paginate results
    const start = pageNum * pageSize;
    const paginatedData = filteredAssignments.slice(start, start + pageSize);
    
    const result = {
      success: true,
      code: 'OK',
      data: {
        pageNum,
        pageSize,
        total: filteredAssignments.length,
        data: paginatedData
      }
    };
    
    return result;
  } catch (error) {
    console.error('Error fetching available assignments:', error);
    return {
      success: false,
      code: 'SERVER_ERROR',
      data: null,
      message: 'Failed to fetch available assignments'
    };
  }
};

/**
 * Get examiner's current schedule
 * Aligns with GET /api/examiners/{examinerId}/schedule
 */
export const getExaminerSchedule = async (examinerId, options = {}) => {
  const { assignmentId, date, dateFrom, dateTo } = options;
  
  
  try {
    await delay(Math.random() * 800 + 400); // 400-1200ms delay
    
    let scheduleData = { ...mockScheduleData };
    
    // Filter by assignment if specified
    if (assignmentId) {
      scheduleData.assignments = scheduleData.assignments.filter(
        assignment => assignment.assignmentId === parseInt(assignmentId)
      );
    }
    
    // Filter by date range if specified
    if (date || dateFrom || dateTo) {
      scheduleData.assignments = scheduleData.assignments.map(assignment => ({
        ...assignment,
        slots: assignment.slots.filter(slot => {
          const slotDate = new Date(slot.start);
          
          if (date) {
            const filterDate = new Date(date);
            return slotDate.toDateString() === filterDate.toDateString();
          }
          
          if (dateFrom && dateTo) {
            const from = new Date(dateFrom);
            const to = new Date(dateTo);
            return slotDate >= from && slotDate <= to;
          }
          
          return true;
        })
      }));
    }
    
    const result = {
      success: true,
      code: 'OK',
      data: scheduleData
    };
    
    return result;
  } catch (error) {
    console.error('Error fetching examiner schedule:', error);
    return {
      success: false,
      code: 'SERVER_ERROR',
      data: null,
      message: 'Failed to fetch examiner schedule'
    };
  }
};

/**
 * Get timeslots available for selection for a specific assignment
 * Aligns with GET /api/assignments/{assignmentId}/timeslots
 */
export const getAvailableTimeslots = async (assignmentId, options = {}) => {
  const { examinerId, date, includeFullSlots = false, pageNum = 0, pageSize = 50 } = options;
  
  try {
    await delay(Math.random() * 700 + 300); // 300-1000ms delay
    // Find assignment details first so we can use its fields below
    const assignment = mockAssignments.find(
      a => a.assignmentId === parseInt(assignmentId)
    );
    if (!assignment) {
      return {
        success: false,
        code: 'NOT_FOUND',
        data: null,
        message: 'Assignment not found'
      };
    }
    
    // Generate realistic available timeslots based on assignment
    const duration = assignment.sessionDurationMinutes;
    const requiredExaminersForAssignment = assignment.requiredExaminers;
    
    const generateTimeslot = (id, dayOffset, hour, minute, durationMinutes, venueId, isFull = false) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + dayOffset);
      startDate.setHours(hour, minute, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + durationMinutes);
      
      const venues = [
        { venueId: 31, name: "Engineering", building: "ENG", room: "405" },
        { venueId: 32, name: "ICT", building: "ICT", room: "203" },
        { venueId: 33, name: "Science", building: "SCI", room: "B201" },
        { venueId: 34, name: "Commerce", building: "COM", room: "G15" },
        { venueId: 35, name: "FBE", building: "FBE", room: "310" },
        { venueId: 36, name: "Law", building: "LAW", room: "104" }
      ];
      
      const venue = venues[venueId % venues.length];
      const requiredExaminers = requiredExaminersForAssignment;
      const currentExaminers = isFull ? requiredExaminers : Math.floor(Math.random() * requiredExaminers);
      
      return {
        slotId: id,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        timezone: "Australia/Melbourne",
        venue,
        sessionCount: Math.floor(Math.random() * 3) + 1,
        requiredExaminers,
        currentExaminers,
        isFull,
        availability: { 
          canSelect: !isFull,
          reason: isFull ? "SLOT_FULL" : undefined
        }
      };
    };
    
    const mockTimeslots = [];
    
    // Generate timeslots for the next week based on assignment availability
    let slotId = 6001;
    for (let day = 2; day <= 8; day++) {
      for (let hour = 9; hour <= 16; hour += 2) {
        if (mockTimeslots.length < assignment.availableTimeslots + 5) { // Some extra slots
          const isFull = Math.random() < 0.2; // 20% chance of being full
          mockTimeslots.push(
            generateTimeslot(slotId++, day, hour, 0, duration, Math.floor(Math.random() * 6), isFull)
          );
          
          // Sometimes add a second slot in the same day
          if (hour < 15 && Math.random() < 0.3) {
            mockTimeslots.push(
              generateTimeslot(slotId++, day, hour, 30, duration, Math.floor(Math.random() * 6), Math.random() < 0.15)
            );
          }
        }
      }
    }
    
    let filteredSlots = [...mockTimeslots];
    
    // Filter by date if specified
    if (date) {
      const filterDate = new Date(date);
      filteredSlots = filteredSlots.filter(slot => {
        const slotDate = new Date(slot.start);
        return slotDate.toDateString() === filterDate.toDateString();
      });
    }
    
    // Filter out full slots unless requested
    if (!includeFullSlots) {
      filteredSlots = filteredSlots.filter(slot => !slot.isFull);
    }
    
    return {
      success: true,
      code: 'OK',
      data: {
        assignment: {
          assignmentId: assignment.assignmentId,
          assignmentName: assignment.assignmentName,
          courseCode: assignment.courseCode,
          courseName: assignment.courseName,
          assessmentType: assignment.assessmentType,
          sessionDurationMinutes: assignment.sessionDurationMinutes,
          requiredExaminers: assignment.requiredExaminers
        },
        examinerInfo: assignment.examinerInfo,
        timeSlots: filteredSlots.slice(0, 20) // Limit to 20 slots for performance
      }
    };
  } catch (error) {
    console.error('Error fetching available timeslots:', error);
    return {
      success: false,
      code: 'SERVER_ERROR',
      data: null,
      message: 'Failed to fetch available timeslots'
    };
  }
};

/**
 * Assign examiner to timeslots (bulk assignment)
 * Aligns with POST /api/assignments/{assignmentId}/timeslots/assign
 */
export const assignExaminerToTimeslots = async (assignmentId, data) => {
  const { examinerId, slotAssignments } = data;
  
  try {
    await delay(Math.random() * 1200 + 800); // 800-2000ms delay
    
    // Simulate validation and partial success scenarios
    const assignedSlots = [];
    const failedSlots = [];
    let addedSessions = 0;
    
    for (const assignment of slotAssignments) {
      // Simulate random failures for demonstration
      if (Math.random() > 0.8) { // 20% chance of failure
        failedSlots.push({
          slotId: assignment.slotId,
          reason: Math.random() > 0.5 ? "SLOT_FULL" : "TIME_CONFLICT"
        });
      } else {
        const mockSlot = {
          slotId: assignment.slotId,
          start: "2025-04-15T09:00:00+10:00",
          end: "2025-04-15T09:30:00+10:00",
          sessionCount: Math.floor(Math.random() * 3) + 1
        };
        assignedSlots.push(mockSlot);
        addedSessions += mockSlot.sessionCount;
      }
    }
    
    return {
      success: true,
      code: 'OK',
      data: {
        assignmentId: parseInt(assignmentId),
        examinerId,
        assignedSlots,
        failedSlots,
        stats: {
          addedSessions,
          totalAssignedSessions: 3 + addedSessions // Current + new
        },
        partial: failedSlots.length > 0
      }
    };
  } catch (error) {
    console.error('Error assigning timeslots:', error);
    return {
      success: false,
      code: 'SERVER_ERROR',
      data: null,
      message: 'Failed to assign timeslots'
    };
  }
};

/**
 * Unassign examiner from timeslot
 * Aligns with DELETE /api/assignments/{assignmentId}/timeslots/{slotId}/unassign
 */
export const unassignExaminerFromTimeslot = async (assignmentId, slotId, examinerId) => {
  try {
    await delay(Math.random() * 600 + 400); // 400-1000ms delay
    
    // Simulate validation failures
    if (Math.random() > 0.9) { // 10% chance of failure
      return {
        success: false,
        code: 'STUDENT_BOOKED',
        data: null,
        message: 'Cannot withdraw from slot as students have already booked'
      };
    }
    
    return {
      success: true,
      code: 'OK',
      data: {
        assignmentId: parseInt(assignmentId),
        slotId: parseInt(slotId),
        examinerId,
        updatedAssignedSessions: 2 // Mock updated count
      }
    };
  } catch (error) {
    console.error('Error unassigning from timeslot:', error);
    return {
      success: false,
      code: 'SERVER_ERROR',
      data: null,
      message: 'Failed to unassign from timeslot'
    };
  }
};

// Export all service functions
export const examinerTimeslotService = {
  getAvailableAssignments,
  getExaminerSchedule,
  getAvailableTimeslots,
  assignExaminerToTimeslots,
  unassignExaminerFromTimeslot
};

export default examinerTimeslotService;
