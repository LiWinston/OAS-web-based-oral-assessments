import { USE_MOCK_API } from '@/lib/config';
import api from './apiClient';

// Mock data
const mockRubrics = new Map();

// Generate mock rubric
const generateMockRubric = (data) => {
  const rubric = {
    id: Date.now().toString(),
    name: data.name || 'New Rubric',
    description: data.description || '',
    totalPoints: data.totalPoints || 100,
    assignmentId: data.assignmentId,
    courseId: data.courseId,
    criteria: data.criteria || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockRubrics.set(rubric.id, rubric);
  return rubric;
};

// Initialize with some mock data
if (USE_MOCK_API) {
  // Sample rubric for testing
  const sampleRubric = {
    id: '1',
    name: 'Presentation Skills Rubric',
    description: 'Comprehensive assessment of oral presentation skills',
    totalPoints: 100,
    assignmentId: '1',
    courseId: '1',
    criteria: [
      {
        id: '1',
        title: 'Content Knowledge',
        description: 'Understanding and accuracy of the subject matter',
        weight: 30,
        markingScale: 'descriptive',
        levels: [
          { id: '1', name: 'Outstanding', description: 'Demonstrates exceptional understanding', minPoints: 27, maxPoints: 30, color: 'green' },
          { id: '2', name: 'Very Good', description: 'Shows strong understanding', minPoints: 24, maxPoints: 26, color: 'blue' },
          { id: '3', name: 'Good', description: 'Shows adequate understanding', minPoints: 21, maxPoints: 23, color: 'yellow' },
          { id: '4', name: 'Satisfactory', description: 'Shows basic understanding', minPoints: 18, maxPoints: 20, color: 'orange' },
          { id: '5', name: 'Needs Improvement', description: 'Limited understanding', minPoints: 0, maxPoints: 17, color: 'red' }
        ],
        comments: [
          { id: '1', text: 'Excellent grasp of complex concepts', levelId: '1' },
          { id: '2', text: 'Good understanding with minor gaps', levelId: '3' },
          { id: '3', text: 'Needs to review fundamental concepts', levelId: '5' }
        ]
      },
      {
        id: '2',
        title: 'Presentation Delivery',
        description: 'Clarity, pace, and engagement of the presentation',
        weight: 40,
        markingScale: 'descriptive',
        levels: [
          { id: '1', name: 'Outstanding', description: 'Engaging and professional delivery', minPoints: 36, maxPoints: 40, color: 'green' },
          { id: '2', name: 'Very Good', description: 'Clear and confident delivery', minPoints: 32, maxPoints: 35, color: 'blue' },
          { id: '3', name: 'Good', description: 'Generally clear delivery', minPoints: 28, maxPoints: 31, color: 'yellow' },
          { id: '4', name: 'Satisfactory', description: 'Adequate delivery with some issues', minPoints: 24, maxPoints: 27, color: 'orange' },
          { id: '5', name: 'Needs Improvement', description: 'Unclear or disorganized delivery', minPoints: 0, maxPoints: 23, color: 'red' }
        ],
        comments: [
          { id: '1', text: 'Excellent eye contact and audience engagement', levelId: '1' },
          { id: '2', text: 'Good pace but could improve voice projection', levelId: '3' },
          { id: '3', text: 'Too fast/slow, difficult to follow', levelId: '5' }
        ]
      },
      {
        id: '3',
        title: 'Visual Aids & Organization',
        description: 'Quality and effectiveness of visual materials',
        weight: 30,
        markingScale: 'descriptive',
        levels: [
          { id: '1', name: 'Outstanding', description: 'Professional and enhances understanding', minPoints: 27, maxPoints: 30, color: 'green' },
          { id: '2', name: 'Very Good', description: 'Clear and well-designed', minPoints: 24, maxPoints: 26, color: 'blue' },
          { id: '3', name: 'Good', description: 'Adequate with minor issues', minPoints: 21, maxPoints: 23, color: 'yellow' },
          { id: '4', name: 'Satisfactory', description: 'Basic but functional', minPoints: 18, maxPoints: 20, color: 'orange' },
          { id: '5', name: 'Needs Improvement', description: 'Poor quality or distracting', minPoints: 0, maxPoints: 17, color: 'red' }
        ],
        comments: [
          { id: '1', text: 'Excellent use of visuals to support content', levelId: '1' },
          { id: '2', text: 'Slides are clear but could be more engaging', levelId: '3' },
          { id: '3', text: 'Too much text, needs more visual elements', levelId: '5' }
        ]
      }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  };
  
  mockRubrics.set(sampleRubric.id, sampleRubric);
}

// Mock service implementation
const mockRubricService = {
  // Get all rubrics for a course
  async getRubricsByCourse(courseId) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const rubrics = Array.from(mockRubrics.values())
      .filter(r => r.courseId === courseId);
    
    return rubrics;
  },

  // Get all rubrics for an assignment
  async getRubricsByAssignment(assignmentId) {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const rubrics = Array.from(mockRubrics.values())
      .filter(r => r.assignmentId === assignmentId);
    
    return rubrics;
  },

  // Get a specific rubric
  async getRubricById(rubricId) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const rubric = mockRubrics.get(rubricId);
    if (!rubric) {
      throw new Error('Rubric not found');
    }
    
    return rubric;
  },

  // Create a new rubric
  async createRubric(rubricData) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validate required fields
    if (!rubricData.name || !rubricData.assignmentId || !rubricData.courseId) {
      throw new Error('Missing required fields');
    }
    
    const rubric = generateMockRubric(rubricData);
    return rubric;
  },

  // Update an existing rubric
  async updateRubric(rubricId, updates) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const rubric = mockRubrics.get(rubricId);
    if (!rubric) {
      throw new Error('Rubric not found');
    }
    
    const updatedRubric = {
      ...rubric,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    mockRubrics.set(rubricId, updatedRubric);
    return updatedRubric;
  },

  // Delete a rubric
  async deleteRubric(rubricId) {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const rubric = mockRubrics.get(rubricId);
    if (!rubric) {
      throw new Error('Rubric not found');
    }
    
    mockRubrics.delete(rubricId);
    return { success: true, message: 'Rubric deleted successfully' };
  },

  // Duplicate a rubric
  async duplicateRubric(rubricId, newAssignmentId) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const original = mockRubrics.get(rubricId);
    if (!original) {
      throw new Error('Original rubric not found');
    }
    
    const duplicate = {
      ...original,
      id: Date.now().toString(),
      name: `${original.name} (Copy)`,
      assignmentId: newAssignmentId || original.assignmentId,
      criteria: original.criteria.map(criterion => ({
        ...criterion,
        id: Date.now().toString() + Math.random(),
        comments: criterion.comments.map(comment => ({
          ...comment,
          id: Date.now().toString() + Math.random()
        }))
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockRubrics.set(duplicate.id, duplicate);
    return duplicate;
  },

  // Validate rubric
  async validateRubric(rubricData) {
    const errors = [];
    
    if (!rubricData.name || rubricData.name.trim().length === 0) {
      errors.push('Rubric name is required');
    }
    
    if (!rubricData.criteria || rubricData.criteria.length === 0) {
      errors.push('At least one criterion is required');
    }
    
    // Check total weight
    const totalWeight = rubricData.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
    if (totalWeight !== 100) {
      errors.push(`Total weight must equal 100% (current: ${totalWeight}%)`);
    }
    
    // Validate each criterion
    rubricData.criteria.forEach((criterion, index) => {
      if (!criterion.title || criterion.title.trim().length === 0) {
        errors.push(`Criterion ${index + 1} must have a title`);
      }
      
      if (criterion.levels.length === 0) {
        errors.push(`Criterion "${criterion.title}" must have at least one performance level`);
      }
      
      // Validate point ranges
      criterion.levels.forEach((level, levelIndex) => {
        if (level.minPoints > level.maxPoints) {
          errors.push(`Invalid point range for level "${level.name}" in criterion "${criterion.title}"`);
        }
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Real API service (to be implemented when backend is ready)
const realRubricService = {
  async getRubricsByCourse(courseId) {
    const response = await api.get(`/courses/${courseId}/rubrics`);
    return response.data;
  },

  async getRubricsByAssignment(assignmentId) {
    const response = await api.get(`/assignments/${assignmentId}/rubrics`);
    return response.data;
  },

  async getRubricById(rubricId) {
    const response = await api.get(`/rubrics/${rubricId}`);
    return response.data;
  },

  async createRubric(rubricData) {
    const response = await api.post('/rubrics', rubricData);
    return response.data;
  },

  async updateRubric(rubricId, updates) {
    const response = await api.put(`/rubrics/${rubricId}`, updates);
    return response.data;
  },

  async deleteRubric(rubricId) {
    const response = await api.delete(`/rubrics/${rubricId}`);
    return response.data;
  },

  async duplicateRubric(rubricId, newAssignmentId) {
    const response = await api.post(`/rubrics/${rubricId}/duplicate`, {
      assignmentId: newAssignmentId
    });
    return response.data;
  },

  async validateRubric(rubricData) {
    const response = await api.post('/rubrics/validate', rubricData);
    return response.data;
  }
};

// Export the appropriate service based on configuration
export const rubricService = USE_MOCK_API ? mockRubricService : realRubricService;