/**
 * Student Service
 * 
 * Service layer for student-related API calls and data management.
 * Follows the existing service patterns in the project with mock data
 * that can be easily replaced with real API calls.
 */

import { apiClient } from './apiClient';

// Mock data for development - will be replaced with real API calls
const mockStudentData = {
  profile: {
    id: 's123456',
    username: 'john_doe',
    email: 'john.doe@student.unimelb.edu.au',
    firstName: 'John',
    lastName: 'Doe',
    studentId: 's123456',
    enrolledCourses: ['COMP90082', 'INFO30005', 'COMP30022']
  },
  
  stats: {
    totalAssessments: 6,
    upcomingAssessments: 3,
    completedAssessments: 2,
    averageScore: 85,
    activeGroups: 2
  },
  
  assessments: [
    {
      id: 1,
      title: 'Software Project Management - Final Presentation',
      course: 'COMP90082',
      courseName: 'Software Project Management',
      date: '2025-04-15',
      time: '10:30 AM - 11:00 AM',
      venue: 'Room 202, Doug McDonell Building',
      type: 'Group Assessment',
      status: 'booked',
      groupId: 1,
      examiner: 'Dr. Sarah Johnson',
      description: 'Final project presentation showcasing the complete software development lifecycle'
    },
    {
      id: 2,
      title: 'Web Information Technology - Progress Evaluation',
      course: 'INFO30005',
      courseName: 'Web Information Technology',
      date: '2025-04-18',
      time: '2:00 PM - 2:30 PM',
      venue: 'Room 105, ICT Building',
      type: 'Individual Assessment',
      status: 'booking_required',
      deadline: '2025-04-15',
      examiner: 'Prof. Michael Chen',
      description: 'Mid-semester progress evaluation for web development project'
    },
    {
      id: 3,
      title: 'IT Project - Project Defense',
      course: 'COMP30022',
      courseName: 'IT Project',
      date: '2025-04-25',
      time: 'Time TBD',
      venue: 'Venue TBD',
      type: 'Group Assessment',
      status: 'booking_required',
      deadline: '2025-04-20',
      groupId: 2,
      examiner: 'Dr. Emily Davis',
      description: 'Final project defense and demonstration'
    }
  ],
  
  results: [
    {
      id: 1,
      assessmentId: 101,
      title: 'Network Security Project',
      course: 'COMP30023',
      courseName: 'Computer Systems',
      type: 'Final Presentation',
      date: '2024-10-15',
      score: 92,
      maxScore: 100,
      grade: 'A',
      feedback: 'Excellent presentation with clear technical explanations and good team coordination. Strong understanding of security principles.',
      examiner: 'Dr. Sarah Johnson',
      detailedFeedback: {
        criteria: [
          { name: 'Technical Knowledge', score: 95, maxScore: 100, feedback: 'Excellent grasp of security concepts' },
          { name: 'Presentation Skills', score: 90, maxScore: 100, feedback: 'Clear and engaging delivery' },
          { name: 'Team Coordination', score: 90, maxScore: 100, feedback: 'Good collaboration evident' }
        ]
      }
    },
    {
      id: 2,
      assessmentId: 102,
      title: 'Machine Learning Models',
      course: 'COMP30027',
      courseName: 'Machine Learning',
      type: 'Final Exam',
      date: '2024-11-10',
      score: 85,
      maxScore: 100,
      grade: 'B+',
      feedback: 'Good understanding of concepts with room for improvement in implementation details.',
      examiner: 'Prof. Michael Chen',
      detailedFeedback: {
        criteria: [
          { name: 'Theoretical Knowledge', score: 88, maxScore: 100, feedback: 'Strong theoretical foundation' },
          { name: 'Implementation', score: 80, maxScore: 100, feedback: 'Some implementation issues' },
          { name: 'Analysis', score: 87, maxScore: 100, feedback: 'Good analytical approach' }
        ]
      }
    }
  ],
  
  groups: [
    {
      id: 1,
      name: 'SPM - Group 5',
      course: 'COMP90082',
      courseName: 'Software Project Management',
      members: [
        { id: 1, name: 'Alice Johnson', email: 'alice.j@student.unimelb.edu.au', role: 'Leader' },
        { id: 2, name: 'Bob Smith', email: 'bob.s@student.unimelb.edu.au', role: 'Developer' },
        { id: 3, name: 'Carol Davis', email: 'carol.d@student.unimelb.edu.au', role: 'Designer' },
        { id: 4, name: 'David Wilson', email: 'david.w@student.unimelb.edu.au', role: 'Tester' },
        { id: 5, name: 'John Doe', email: 'john.doe@student.unimelb.edu.au', role: 'Developer', isCurrentUser: true }
      ],
      upcomingAssessment: {
        title: 'Final Presentation',
        date: '2025-04-15',
        status: 'booked'
      },
      projectTitle: 'University Event Management System'
    },
    {
      id: 2,
      name: 'IT Project - Group 7',
      course: 'COMP30022',
      courseName: 'IT Project',
      members: [
        { id: 1, name: 'Emma Brown', email: 'emma.b@student.unimelb.edu.au', role: 'Leader' },
        { id: 2, name: 'Frank Miller', email: 'frank.m@student.unimelb.edu.au', role: 'Backend' },
        { id: 3, name: 'Grace Lee', email: 'grace.l@student.unimelb.edu.au', role: 'Frontend' },
        { id: 4, name: 'John Doe', email: 'john.doe@student.unimelb.edu.au', role: 'Full Stack', isCurrentUser: true }
      ],
      upcomingAssessment: {
        title: 'Project Defense',
        date: '2025-04-25',
        status: 'booking_required'
      },
      projectTitle: 'Smart Campus Navigation App'
    }
  ],
  
  notifications: [
    {
      id: 1,
      type: 'success',
      icon: 'fas fa-calendar-check',
      title: 'Booking Confirmed',
      message: 'Your SPM Final Presentation is booked for April 15, 10:30 AM',
      time: '10 min ago',
      unread: true,
      createdAt: '2025-04-10T14:50:00Z'
    },
    {
      id: 2,
      type: 'warning',
      icon: 'fas fa-exclamation-circle',
      title: 'Upcoming Assessment Reminder',
      message: 'Web Info Tech presentation tomorrow at 2:00 PM',
      time: '1 hour ago',
      unread: true,
      createdAt: '2025-04-10T13:00:00Z'
    },
    {
      id: 3,
      type: 'info',
      icon: 'fas fa-users',
      title: 'Group Assignment Update',
      message: "You've been added to Group 7 for IT Project",
      time: 'Yesterday',
      unread: true,
      createdAt: '2025-04-09T16:30:00Z'
    }
  ]
};

/**
 * Student Service Class
 * Provides methods for fetching student-related data
 */
class StudentService {
  /**
   * Get student profile information
   */
  async getProfile() {
    try {
      // TODO: Replace with real API call
      // const response = await apiClient.get('/student/profile');
      // return response.data;
      
      // Mock implementation
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockStudentData.profile), 500);
      });
    } catch (error) {
      console.error('Error fetching student profile:', error);
      throw error;
    }
  }

  /**
   * Get student dashboard statistics
   */
  async getStats() {
    try {
      // TODO: Replace with real API call
      // const response = await apiClient.get('/student/stats');
      // return response.data;
      
      // Mock implementation
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockStudentData.stats), 300);
      });
    } catch (error) {
      console.error('Error fetching student stats:', error);
      throw error;
    }
  }

  /**
   * Get student assessments
   * @param {string} status - Filter by status ('all', 'upcoming', 'completed', 'booking_required')
   */
  async getAssessments(status = 'all') {
    try {
      // TODO: Replace with real API call
      // const response = await apiClient.get(`/student/assessments?status=${status}`);
      // return response.data;
      
      // Mock implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          let assessments = mockStudentData.assessments;
          if (status !== 'all') {
            assessments = assessments.filter(assessment => assessment.status === status);
          }
          resolve(assessments);
        }, 400);
      });
    } catch (error) {
      console.error('Error fetching student assessments:', error);
      throw error;
    }
  }

  /**
   * Get student assessment results
   */
  async getResults() {
    try {
      // TODO: Replace with real API call
      // const response = await apiClient.get('/student/results');
      // return response.data;
      
      // Mock implementation
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockStudentData.results), 350);
      });
    } catch (error) {
      console.error('Error fetching student results:', error);
      throw error;
    }
  }

  /**
   * Get student groups
   */
  async getGroups() {
    try {
      // TODO: Replace with real API call
      // const response = await apiClient.get('/student/groups');
      // return response.data;
      
      // Mock implementation
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockStudentData.groups), 300);
      });
    } catch (error) {
      console.error('Error fetching student groups:', error);
      throw error;
    }
  }

  /**
   * Get student notifications
   */
  async getNotifications() {
    try {
      // TODO: Replace with real API call
      // const response = await apiClient.get('/student/notifications');
      // return response.data;
      
      // Mock implementation
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockStudentData.notifications), 200);
      });
    } catch (error) {
      console.error('Error fetching student notifications:', error);
      throw error;
    }
  }

  /**
   * Book an assessment slot
   * @param {number} assessmentId - Assessment ID
   * @param {string} timeSlot - Selected time slot
   */
  async bookAssessment(assessmentId, timeSlot) {
    try {
      // TODO: Replace with real API call
      // const response = await apiClient.post('/student/assessments/book', {
      //   assessmentId,
      //   timeSlot
      // });
      // return response.data;
      
      // Mock implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Assessment booked successfully',
            bookingId: `booking_${Date.now()}`
          });
        }, 1000);
      });
    } catch (error) {
      console.error('Error booking assessment:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   * @param {number[]} notificationIds - Array of notification IDs
   */
  async markNotificationsAsRead(notificationIds) {
    try {
      // TODO: Replace with real API call
      // const response = await apiClient.patch('/student/notifications/read', {
      //   notificationIds
      // });
      // return response.data;
      
      // Mock implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 300);
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const studentService = new StudentService();
