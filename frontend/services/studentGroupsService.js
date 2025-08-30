/**
 * Student Groups Service
 * 
 * Service layer for student groups-related API calls following the API contracts.
 * Implements the endpoints specified in Student-Groups-API-Contracts(Final).md
 * with mock data that matches the expected response format.
 */

import { apiClient } from './apiClient';

// Mock data following the API contract data models
const mockGroupsData = {
  // Student groups overview - paginated response
  groupsOverview: {
    pageNum: 0,
    pageSize: 20,
    total: 2,
    data: [
      {
        groupId: 501,
        groupName: "Team Alpha",
        assignmentId: 101,
        assignmentName: "Oral Exam 1",
        courseCode: "COMP90082",
        semester: "2025 S1",
        memberCount: 5,
        status: "ACTIVE"
      },
      {
        groupId: 502,
        groupName: "Team Beta",
        assignmentId: 102,
        assignmentName: "Project Defense",
        courseCode: "COMP30022",
        semester: "2025 S1",
        memberCount: 4,
        status: "ACTIVE"
      }
    ]
  },

  // Individual group details with full member information
  groupDetails: {
    501: {
      groupId: 501,
      groupName: "Team Alpha",
      assignmentId: 101,
      assignmentName: "Oral Exam 1",
      courseCode: "COMP90082",
      semester: "2025 S1",
      members: [
        {
          studentId: 201,
          name: "Bob Student",
          email: "bob@student.unimelb.edu.au"
        },
        {
          studentId: 202,
          name: "Ava Student",
          email: "ava@student.unimelb.edu.au"
        },
        {
          studentId: 203,
          name: "Charlie Brown",
          email: "charlie@student.unimelb.edu.au"
        },
        {
          studentId: 204,
          name: "Diana Prince",
          email: "diana@student.unimelb.edu.au"
        },
        {
          studentId: 205,
          name: "Eve Adams",
          email: "eve@student.unimelb.edu.au",
          isCurrentUser: true // Marks the current student
        }
      ]
    },
    502: {
      groupId: 502,
      groupName: "Team Beta",
      assignmentId: 102,
      assignmentName: "Project Defense", 
      courseCode: "COMP30022",
      semester: "2025 S1",
      members: [
        {
          studentId: 206,
          name: "Frank Miller",
          email: "frank@student.unimelb.edu.au"
        },
        {
          studentId: 207,
          name: "Grace Hopper",
          email: "grace@student.unimelb.edu.au"
        },
        {
          studentId: 208,
          name: "Henry Ford",
          email: "henry@student.unimelb.edu.au"
        },
        {
          studentId: 205,
          name: "Eve Adams", 
          email: "eve@student.unimelb.edu.au",
          isCurrentUser: true
        }
      ]
    }
  }
};

// Mock current user ID for authorization checks
const MOCK_CURRENT_USER_ID = 205;

/**
 * Student Groups Service Class
 * Implements the API contracts defined in Student-Groups-API-Contracts(Final).md
 */
class StudentGroupsService {
  /**
   * List student's active groups (assignment-level)
   * GET /api/students/{studentId}/groups?status=active&pageNum=&pageSize=&sort=semester_desc
   * 
   * @param {number} studentId - The student ID
   * @param {Object} options - Query options
   * @param {string} options.status - Filter status (default: 'active')
   * @param {number} options.pageNum - Page number (default: 0)
   * @param {number} options.pageSize - Page size (default: 20)
   * @param {string} options.sort - Sort order (default: 'semester_desc')
   * @returns {Promise<Object>} API response with groups overview
   */
  async getStudentGroups(studentId, options = {}) {
    try {
      const {
        status = 'active',
        pageNum = 0,
        pageSize = 20,
        sort = 'semester_desc'
      } = options;

      // TODO: Replace with real API call
      // const response = await apiClient.get(
      //   `/api/students/${studentId}/groups`,
      //   {
      //     params: { status, pageNum, pageSize, sort }
      //   }
      // );
      // return response.data;
      
      // Mock implementation with realistic delay
      return new Promise((resolve) => {
        setTimeout(() => {
          const response = {
            success: true,
            code: "OK",
            data: mockGroupsData.groupsOverview
          };
          resolve(response);
        }, 300);
      });
    } catch (error) {
      console.error('Error fetching student groups:', error);
      
      // Handle different error scenarios based on API contract
      if (error.response?.status === 403) {
        throw new Error('Access forbidden - not authorized to view groups');
      } else if (error.response?.status === 404) {
        throw new Error('Student not found or no groups available');
      }
      
      throw error;
    }
  }

  /**
   * Get group details (members only)
   * GET /api/students/{studentId}/groups/{groupId}
   * 
   * Validates membership; returns 403 if the student is not a member.
   * 
   * @param {number} studentId - The student ID
   * @param {number} groupId - The group ID
   * @returns {Promise<Object>} API response with group details
   */
  async getGroupDetails(studentId, groupId) {
    try {
      // TODO: Replace with real API call
      // const response = await apiClient.get(`/api/students/${studentId}/groups/${groupId}`);
      // return response.data;
      
      // Mock implementation with membership validation
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate membership validation
          const groupDetails = mockGroupsData.groupDetails[groupId];
          
          if (!groupDetails) {
            const error = new Error('Group not found or archived');
            error.response = { status: 404 };
            error.code = 'NOT_FOUND';
            reject(error);
            return;
          }
          
          // Check if current user is a member of this group
          const isMember = groupDetails.members.some(
            member => member.studentId === MOCK_CURRENT_USER_ID
          );
          
          if (!isMember) {
            const error = new Error('Access forbidden - not a member of this group');
            error.response = { status: 403 };
            error.code = 'FORBIDDEN';
            reject(error);
            return;
          }
          
          const response = {
            success: true,
            code: "OK",
            data: {
              group: groupDetails
            }
          };
          resolve(response);
        }, 400);
      });
    } catch (error) {
      console.error('Error fetching group details:', error);
      
      // Handle different error scenarios based on API contract
      if (error.code === 'FORBIDDEN') {
        throw new Error("You don't have access to this group.");
      } else if (error.code === 'NOT_FOUND') {
        throw new Error("We couldn't find this group.");
      } else if (error.code === 'NOT_ELIGIBLE') {
        throw new Error("This assignment doesn't use group membership.");
      } else if (error.code === 'STALE_DATA') {
        throw new Error("This information changed. Please refresh.");
      }
      
      throw error;
    }
  }

  /**
   * Helper method to get all groups for the current user
   * This is used by dashboard components and doesn't directly map to an API endpoint
   * but uses the getStudentGroups method internally
   * 
   * @returns {Promise<Array>} Array of group summary objects
   */
  async getCurrentUserGroups() {
    try {
      const response = await this.getStudentGroups(MOCK_CURRENT_USER_ID);
      return response.data.data; // Extract the groups array from the paginated response
    } catch (error) {
      console.error('Error fetching current user groups:', error);
      throw error;
    }
  }

  /**
   * Helper method to get group details for the current user
   * This adds the membership validation layer for security
   * 
   * @param {number} groupId - The group ID
   * @returns {Promise<Object>} Group details object
   */
  async getCurrentUserGroupDetails(groupId) {
    try {
      const response = await this.getGroupDetails(MOCK_CURRENT_USER_ID, groupId);
      return response.data.group; // Extract the group object from the response
    } catch (error) {
      console.error('Error fetching current user group details:', error);
      throw error;
    }
  }

  /**
   * Format group data for UI components
   * Transforms API response data into UI-friendly format
   * 
   * @param {Object} group - Raw group data from API
   * @returns {Object} Formatted group data
   */
  formatGroupForUI(group) {
    return {
      id: group.groupId,
      groupId: group.groupId,
      name: group.groupName,
      assignmentId: group.assignmentId,
      assignmentName: group.assignmentName,
      courseCode: group.courseCode,
      courseName: group.courseCode, // Could be expanded with full course name
      semester: group.semester,
      memberCount: group.memberCount || (group.members && group.members.length) || 0,
      status: group.status,
      members: group.members || [],
      // Add additional UI properties
      displayName: `${group.courseCode} - ${group.groupName}`,
      isActive: group.status === 'ACTIVE'
    };
  }

  /**
   * Format member data for UI display
   * 
   * @param {Object} member - Raw member data from API
   * @returns {Object} Formatted member data
   */
  formatMemberForUI(member) {
    return {
      id: member.studentId,
      studentId: member.studentId,
      name: member.name,
      email: member.email,
      isCurrentUser: member.isCurrentUser || false,
      // Generate initials for avatar
      initials: member.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      // Generate display name
      displayName: member.isCurrentUser ? `${member.name} (You)` : member.name
    };
  }
}

// Export singleton instance
export const studentGroupsService = new StudentGroupsService();