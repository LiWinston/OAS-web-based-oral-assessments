import apiClient from './apiClient';

// Mock data for development
const mockTokens = {
  'admin-token-123': {
    status: 'valid',
    alreadyRegistered: false,
    role: 'COURSE_ADMIN',
    email: 'alice@student.unimelb.edu.au',
    fullName: 'Alice Lee',
    department: 'Engineering',
    courseContext: null,
    assignmentContext: null
  },
  'student-token-456': {
    status: 'valid',
    alreadyRegistered: false,
    role: 'STUDENT',
    email: 'john.doe@student.unimelb.edu.au',
    fullName: 'John Doe',
    department: null,
    courseContext: {
      courseId: 'COMP90082',
      courseName: 'Software Project',
      courseCode: 'COMP90082',
      coordinatorName: 'Dr. Alice Lee'
    },
    assignmentContext: {
      assignmentId: 'assignment-1',
      assignmentName: 'Mid-Semester Oral Assessment'
    }
  },
  'examiner-token-789': {
    status: 'valid',
    alreadyRegistered: false,
    role: 'EXAMINER',
    email: 'sarah.smith@unimelb.edu.au',
    fullName: 'Dr. Sarah Smith',
    department: null,
    courseContext: {
      courseId: 'COMP90082',
      courseName: 'Software Project',
      courseCode: 'COMP90082',
      coordinatorName: 'Dr. Alice Lee'
    },
    assignmentContext: {
      assignmentId: 'assignment-1',
      assignmentName: 'Mid-Semester Oral Assessment'
    }
  },
  'registered-token-111': {
    status: 'valid',
    alreadyRegistered: true,
    role: 'STUDENT',
    email: 'existing@student.unimelb.edu.au',
    fullName: 'Existing User',
    department: null,
    courseContext: null,
    assignmentContext: null
  },
  'expired-token-222': {
    status: 'expired',
    alreadyRegistered: false,
    role: null,
    email: null,
    fullName: null,
    department: null,
    courseContext: null,
    assignmentContext: null
  },
  // Additional test tokens for different courses
  'student-math-token': {
    status: 'valid',
    alreadyRegistered: false,
    role: 'STUDENT',
    email: 'jane.smith@student.unimelb.edu.au',
    fullName: 'Jane Smith',
    department: null,
    courseContext: {
      courseId: 'MAST10006',
      courseName: 'Calculus 2',
      courseCode: 'MAST10006',
      coordinatorName: 'Prof. Michael Brown'
    },
    assignmentContext: {
      assignmentId: 'assignment-calc-2',
      assignmentName: 'Final Oral Presentation'
    }
  },
  'examiner-biology-token': {
    status: 'valid',
    alreadyRegistered: false,
    role: 'EXAMINER',
    email: 'peter.jones@unimelb.edu.au',
    fullName: 'Dr. Peter Jones',
    department: null,
    courseContext: {
      courseId: 'BIOL10001',
      courseName: 'Biology of Cells and Organisms',
      courseCode: 'BIOL10001',
      coordinatorName: 'Prof. Lisa Anderson'
    },
    assignmentContext: {
      assignmentId: 'assignment-bio-1',
      assignmentName: 'Lab Viva Examination'
    }
  }
};

// Map backend roles to frontend roles
const roleMapping = {
  'COURSE_ADMIN': 'COURSE_ADMIN',
  'STUDENT': 'STUDENT',
  'EXAMINER': 'EXAMINER',
  'ROLE_ADMIN': 'COURSE_ADMIN',
  'ROLE_STUDENT': 'STUDENT',
  'ROLE_EXAMINER': 'EXAMINER'
};

/**
 * Verify an onboarding token
 * @param {string} token - The onboarding token from email link
 * @returns {Promise<Object>} Verification result with user data
 */
export async function verifyOnboardingToken(token) {
  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
  
  if (useMockData) {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockData = mockTokens[token];
    
    if (!mockData) {
      return {
        success: false,
        status: 'invalid',
        message: 'Invalid or expired token'
      };
    }
    
    if (mockData.status === 'expired') {
      return {
        success: false,
        status: 'expired',
        message: 'This invitation link has expired. Please contact your administrator for a new invitation.'
      };
    }
    
    return {
      success: true,
      ...mockData
    };
  }
  
  try {
    const response = await apiClient.get('/onboarding/verify', {
      params: { token }
    });
    
    // Extract data from the backend response structure
    const data = response.data.data || response.data;
    
    // Map backend role to frontend role if needed
    if (data.role) {
      data.role = roleMapping[data.role] || data.role;
    }
    
    // Return structured response matching expected format
    return {
      success: response.data.success !== false,
      status: data.status,
      alreadyRegistered: data.alreadyRegistered || false,
      role: data.role,
      email: data.email,
      fullName: data.fullName,
      department: data.department,
      courseContext: data.courseContext,
      assignmentContext: data.assignmentContext,
      message: data.message
    };
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.response?.status === 400 || error.response?.status === 404) {
      const errorData = error.response.data.data || error.response.data;
      return {
        success: false,
        status: errorData.status || 'invalid',
        message: errorData.message || 'Invalid or expired token'
      };
    }
    
    throw error;
  }
}

/**
 * Complete onboarding and create user account
 * @param {Object} data - Registration data
 * @returns {Promise<Object>} Registration result with auth tokens
 */
export async function completeOnboarding(data) {
  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
  
  if (useMockData) {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockToken = mockTokens[data.token];
    
    if (!mockToken || mockToken.status !== 'valid') {
      throw new Error('Invalid token');
    }
    
    if (mockToken.alreadyRegistered) {
      throw new Error('User already registered');
    }
    
    // Simulate successful registration
    const frontendRole = roleMapping[mockToken.role] || mockToken.role;
    const backendRole = `ROLE_${mockToken.role}`;
    
    return {
      success: true,
      data: {
        userId: Math.floor(Math.random() * 1000),
        fullName: data.fullName,
        email: mockToken.email,
        role: backendRole,
        department: data.department || null,
        accessToken: `mock-access-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`,
        tokenType: 'Bearer',
        expiresIn: 900
      }
    };
  }
  
  try {
    // Prepare request payload matching backend API
    const requestPayload = {
      token: data.token,
      name: data.fullName, // Backend expects 'name', not 'fullName'
      password: data.password,
      department: data.department
    };
    
    const response = await apiClient.post('/onboarding/register', requestPayload);
    
    // Handle backend response structure
    const responseData = response.data.data || response.data;
    
    // Map backend role to frontend format if needed
    if (responseData.role) {
      responseData.frontendRole = roleMapping[responseData.role] || responseData.role;
    }
    
    return {
      success: response.data.success !== false,
      data: responseData
    };
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific error responses
    if (error.response?.data) {
      const errorData = error.response.data;
      
      // If backend returns success:false with a message in data field
      if (errorData.success === false && errorData.data) {
        throw new Error(errorData.data);
      }
      
      // If backend returns error message directly
      if (errorData.message) {
        throw new Error(errorData.message);
      }
      
      // If data field contains the error message (as seen in curl response)
      if (typeof errorData.data === 'string') {
        throw new Error(errorData.data);
      }
    }
    
    throw new Error('Registration failed. Please try again.');
  }
}

/**
 * Get list of departments (for Course Admin onboarding)
 * @returns {Promise<Array>} List of departments
 */
export async function getDepartments() {
  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
  
  if (useMockData) {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return [
      'Computer Science',
      'Engineering',
      'Mathematics',
      'Physics',
      'Biology',
      'Chemistry',
      'Business',
      'Medicine',
      'Law',
      'Arts',
      'Education',
      'Psychology'
    ];
  }
  
  // For now, use static list since /departments endpoint doesn't exist yet
  // TODO: Implement /departments endpoint in Spring Boot backend
  return [
    'Computer Science',
    'Engineering',
    'Mathematics',
    'Physics',
    'Biology',
    'Chemistry',
    'Business',
    'Medicine',
    'Law',
    'Arts',
    'Education',
    'Psychology'
  ];
  
  // Commented out for now - uncomment when backend endpoint is ready
  /*
  try {
    const response = await apiClient.get('/departments');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    
    // Fallback to static list if API fails
    return [
      'Computer Science',
      'Engineering',
      'Mathematics',
      'Physics',
      'Biology',
      'Chemistry',
      'Business',
      'Medicine',
      'Law',
      'Arts',
      'Education',
      'Psychology'
    ];
  }
  */
}

/**
 * Resend onboarding invitation
 * @param {string} email - Email address to resend invitation to
 * @returns {Promise<Object>} Result of resend operation
 */
export async function resendOnboardingInvitation(email) {
  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
  
  if (useMockData) {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Invitation resent successfully'
    };
  }
  
  try {
    const response = await apiClient.post('/onboarding/resend', { email });
    return response.data;
  } catch (error) {
    console.error('Failed to resend invitation:', error);
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    throw new Error('Failed to resend invitation. Please try again.');
  }
}