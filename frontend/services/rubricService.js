// For development - mock API responses
const USE_MOCK_API = false;
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
    criteria: (data.criteria || []).map((criterion, index) => ({
      ...criterion,
      criterionId: criterion.criterionId || criterion.id || `crit-${Date.now().toString(36)}-${index}`,
      criterionType: (criterion.criterionType || criterion.component || 'INDIVIDUAL').toUpperCase(),
      title: criterion.title || `Criterion ${index + 1}`,
      levels: (criterion.levels || []).map((level, levelIndex) => ({
        ...level,
        comments: Array.isArray(level.comments) ? level.comments : [],
        id: level.id || `crit-${index}-level-${levelIndex}`
      }))
    })),
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
        criterionId: 'crit-mock-1',
        criterionType: 'INDIVIDUAL',
        title: 'Content Knowledge',
        description: 'Understanding and accuracy of the subject matter',
        weight: 30,
        markingScale: 'descriptive',
        levels: [
          { id: '1', description: 'Outstanding - Demonstrates exceptional understanding', minPoints: 27, maxPoints: 30, color: 'blue' },
          { id: '2', description: 'Very Good - Shows strong understanding', minPoints: 24, maxPoints: 26, color: 'blue' },
          { id: '3', description: 'Good - Shows adequate understanding', minPoints: 21, maxPoints: 23, color: 'blue' },
          { id: '4', description: 'Satisfactory - Shows basic understanding', minPoints: 18, maxPoints: 20, color: 'blue' },
          { id: '5', description: 'Needs Improvement - Limited understanding', minPoints: 0, maxPoints: 17, color: 'blue' }
        ],
        comments: [
          { id: '1', text: 'Excellent grasp of complex concepts', levelId: '1' },
          { id: '2', text: 'Good understanding with minor gaps', levelId: '3' },
          { id: '3', text: 'Needs to review fundamental concepts', levelId: '5' }
        ]
      },
      {
        id: '2',
        criterionId: 'crit-mock-2',
        criterionType: 'INDIVIDUAL',
        title: 'Presentation Delivery',
        description: 'Clarity, pace, and engagement of the presentation',
        weight: 40,
        markingScale: 'descriptive',
        levels: [
          { id: '1', description: 'Outstanding - Engaging and professional delivery', minPoints: 36, maxPoints: 40, color: 'blue' },
          { id: '2', description: 'Very Good - Clear and confident delivery', minPoints: 32, maxPoints: 35, color: 'blue' },
          { id: '3', description: 'Good - Generally clear delivery', minPoints: 28, maxPoints: 31, color: 'blue' },
          { id: '4', description: 'Satisfactory - Adequate delivery with some issues', minPoints: 24, maxPoints: 27, color: 'blue' },
          { id: '5', description: 'Needs Improvement - Unclear or disorganized delivery', minPoints: 0, maxPoints: 23, color: 'blue' }
        ],
        comments: [
          { id: '1', text: 'Excellent eye contact and audience engagement', levelId: '1' },
          { id: '2', text: 'Good pace but could improve voice projection', levelId: '3' },
          { id: '3', text: 'Too fast/slow, difficult to follow', levelId: '5' }
        ]
      },
      {
        id: '3',
        criterionId: 'crit-mock-3',
        criterionType: 'GROUP',
        title: 'Visual Aids & Organization',
        description: 'Quality and effectiveness of visual materials',
        weight: 30,
        markingScale: 'descriptive',
        levels: [
          { id: '1', description: 'Outstanding - Professional and enhances understanding', minPoints: 27, maxPoints: 30, color: 'blue' },
          { id: '2', description: 'Very Good - Clear and well-designed', minPoints: 24, maxPoints: 26, color: 'blue' },
          { id: '3', description: 'Good - Adequate with minor issues', minPoints: 21, maxPoints: 23, color: 'blue' },
          { id: '4', description: 'Satisfactory - Basic but functional', minPoints: 18, maxPoints: 20, color: 'blue' },
          { id: '5', description: 'Needs Improvement - Poor quality or distracting', minPoints: 0, maxPoints: 17, color: 'blue' }
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
    
    // Check total weight/points based on basis
    const basis = rubricData.weightBasis || 'percentage';
    const expected = basis === 'percentage' ? 100 : (rubricData.totalPoints || 0);
    const total = rubricData.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
    if (total !== expected) {
      errors.push(`Total ${basis === 'percentage' ? 'weight' : 'points'} must equal ${expected} (current: ${total})`);
    }
    
    // Validate each criterion
    rubricData.criteria.forEach((criterion, index) => {
      if (!criterion.title || criterion.title.trim().length === 0) {
        errors.push(`Criterion ${index + 1} must have a title`);
      }
      const criterionTypeValue = (criterion.criterionType || criterion.component || '').toUpperCase();
      if (!criterionTypeValue || !['INDIVIDUAL', 'GROUP'].includes(criterionTypeValue)) {
        errors.push(`Criterion ${criterion.title || index + 1} must have a criterion type (Individual or Group)`);
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

const normalizeCriterionTypeForPayload = (value) => {
  const normalized = (value || '').toString().trim().toUpperCase();
  if (normalized === 'GROUP') return 'GROUP';
  return 'INDIVIDUAL';
};

const transformLevelForPayload = (level = {}, criterionId, index) => {
  const description = (level.description || level.name || `Level ${index + 1}`).toString();
  const startPoint = Number(level.minPoints ?? level.startPoint ?? level.points ?? 0);
  const endPoint = Number(level.maxPoints ?? level.endPoint ?? level.points ?? startPoint);
  const comments = Array.isArray(level.comments)
    ? level.comments
    : Array.isArray(level.preDefinedComment)
      ? level.preDefinedComment
      : [];

  return {
    description,
    startPoint,
    endPoint,
    preDefinedComment: comments
      .map((comment) => (typeof comment === 'string' ? comment : comment?.text))
      .filter(Boolean),
  };
};

const transformCriterionForPayload = (criterion = {}) => {
  const levels = Array.isArray(criterion.levels)
    ? criterion.levels.map((level, index) => transformLevelForPayload(level, criterion.criterionId || criterion.id, index))
    : [];

  const description = (criterion.description || criterion.title || '').toString();

  return {
    criterionId: criterion.criterionId || criterion.id,
    title: criterion.title,
    description,
    weight: Number(criterion.weight) || 0,
    scaleType: 'points',
    performanceLevel: levels,
  };
};

const buildRubricSections = (criteria = []) => {
  const grouped = {
    INDIVIDUAL: [],
    GROUP: [],
  };
  const combined = [];

  criteria.forEach((criterion) => {
    const typeKey = normalizeCriterionTypeForPayload(criterion.criterionType || criterion.component);
    const payload = transformCriterionForPayload(criterion);
    grouped[typeKey].push(payload);
    combined.push({ ...payload, component: typeKey });
  });

  return { grouped, combined };
};

const buildAssignmentRequestPayload = (rubricData) => {
  const assignmentId = parseInt(rubricData.assignmentId);
  const subjectId = parseInt(rubricData.courseId);
  const { grouped, combined } = buildRubricSections(rubricData.criteria || []);
  const weightBasis = rubricData.weightBasis || 'percentage';
  const totalPointsRaw = Number(rubricData.totalPoints);
  const totalPoints = Number.isFinite(totalPointsRaw)
    ? totalPointsRaw
    : weightBasis === 'percentage'
      ? 100
      : 0;

  const individualWeightValue = Number(rubricData.individualWeight);
  const groupWeightValue = Number(rubricData.groupWeight);
  const individualWeight = Number.isFinite(individualWeightValue) ? individualWeightValue : 0;
  const groupWeight = Number.isFinite(groupWeightValue) ? groupWeightValue : 0;

  return {
    id: assignmentId,
    subjectId,
    name: rubricData.assignmentName || rubricData.name,
    description: rubricData.assignmentDescription || 'Assignment description',
    type: rubricData.assignmentType || 'individual',
    startDate: rubricData.startDate || new Date().toISOString(),
    endDate: rubricData.endDate || new Date().toISOString(),
    weight: rubricData.weight || 25,
    progress: rubricData.progress || 0,
    status: rubricData.status || 'PENDING',
    rubricMetaInfo: {
      name: rubricData.name,
      description: rubricData.description,
      totalPoints,
      weightBasis,
      individualWeight,
      groupWeight,
      individualRubrics: grouped.INDIVIDUAL,
      groupRubrics: grouped.GROUP,
    },
    rubricsInfo: combined,
  };
};

// Real API service (to be implemented when backend is ready)
const realRubricService = {
  async getRubricsByCourse(courseId) {
    const response = await api.get(`/api/courses/${courseId}/rubrics`);
    return response.data;
  },

  async getRubricsByAssignment(assignmentId) {
    const response = await api.get(`/api/assignments/${assignmentId}/rubrics`);
    return response.data;
  },

  async getRubricById(rubricId) {
    const response = await api.get(`/api/assignments/rubric/${rubricId}`);
    return response.data;
  },

  async createRubric(rubricData) {
    const requestData = buildAssignmentRequestPayload(rubricData);

    const response = await api.put(`/api/assignments/${rubricData.assignmentId}`, requestData);
    return response.data;
  },

  async updateRubric(rubricId, updates) {
    const requestData = buildAssignmentRequestPayload(updates);

    const response = await api.put(`/api/assignments/${updates.assignmentId}`, requestData);
    return response.data;
  },

  async deleteRubric(rubricId) {
    const response = await api.delete(`/api/assignments/rubric/${rubricId}`);
    return response.data;
  },

  async duplicateRubric(rubricId, newAssignmentId) {
    const response = await api.post(`/api/assignments/rubric/${rubricId}/duplicate`, {
      assignmentId: newAssignmentId
    });
    return response.data;
  },

  async validateRubric(rubricData) {
    // Client-side validation since backend doesn't seem to have this endpoint
    const errors = [];
    
    if (!rubricData.name || rubricData.name.trim().length === 0) {
      errors.push('Rubric name is required');
    }
    
    if (!rubricData.criteria || rubricData.criteria.length === 0) {
      errors.push('At least one criterion is required');
    }
    
    // Check total weight/points based on basis
    const basis = rubricData.weightBasis || 'percentage';
    const expected = basis === 'percentage' ? 100 : (rubricData.totalPoints || 0);
    const total = rubricData.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
    if (total !== expected) {
      errors.push(`Total ${basis === 'percentage' ? 'weight' : 'points'} must equal ${expected} (current: ${total})`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Export the appropriate service based on configuration
export const rubricService = USE_MOCK_API ? mockRubricService : realRubricService;
