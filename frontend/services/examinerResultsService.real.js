/**
 * Real API Implementation for Examiner Results Service
 * 
 * This service handles the results page functionality for examiners,
 * calling the real backend API endpoints.
 */

import examinerAssessmentService from './examinerAssessmentService';
import apiClient from './apiClient';

/**
 * Helper function to safely parse JSON strings
 * @param {string} jsonString - JSON string to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} Parsed JSON or fallback
 */
function safeJsonParse(jsonString, fallback = null) {
  try {
    if (!jsonString) return fallback;
    return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  } catch (error) {
    console.warn('Failed to parse JSON:', jsonString, error);
    return fallback;
  }
}

/**
 * Transform backend assessment data to frontend format
 * @param {Array} backendItems - Items from backend API
 * @returns {Array} Transformed items for frontend components
 */
function transformAssessmentItems(backendItems) {
  if (!Array.isArray(backendItems)) {
    return [];
  }

  return backendItems.map(item => {
    // Parse JSON strings with logging
    console.log('Processing item:', item.submissionId, 'assignmentId:', item.assignmentId, 'sessionId:', item.sessionId);
    const rubricMeta = safeJsonParse(item.rubricMetaSnapshot, {});
    const rubricsInfo = safeJsonParse(item.rubricsInfoSnapshot, []);
    const scores = safeJsonParse(item.scoresJson, []);
    
    console.log('Parsed rubricMeta:', rubricMeta);
    console.log('Raw item structure:', item);

    return {
      // Core assessment data
      assessmentId: item.submissionId || item.assessmentId,
      submissionId: item.submissionId,
      assignmentId: item.assignmentId,
      sessionId: item.sessionId,
      
      // Assignment info - use rubric meta for assignment name
      assignment: {
        id: item.assignmentId,
        name: rubricMeta.name || item.assignmentName || 'Assignment',
        type: item.subjectType || 'mixed',
        courseId: item.courseId,
        courseCode: item.courseCode,
        courseName: item.courseName,
        rubricMeta: rubricMeta
      },
      
      // Session info - use submittedAt as primary date
      session: {
        id: item.sessionId,
        start: item.submittedAt,
        end: item.updatedAt,
        timezone: 'Australia/Melbourne',
        durationMinutes: 45,
        venue: {
          venueId: 1,
          name: item.venueName || 'TBD',
          building: item.venueBuilding || 'TBD', 
          room: item.venueRoom || 'TBD'
        }
      },
      
      // Entity info (student or group)
      entity: {
        kind: item.subjectType === 'GROUP' ? 'GROUP' : 'INDIVIDUAL',
        ...(item.subjectType === 'GROUP' ? {
          group: {
            groupId: item.subjectId,
            groupName: item.groupName || `Group ${item.subjectId}`,
            memberCount: item.memberCount || 0
          }
        } : {
          student: {
            studentId: item.subjectId,
            name: item.studentName || `Student ${item.subjectId}`
          }
        })
      },
      
      // Assessment status and scoring - handle RELEASED status correctly
      assessmentStatus: item.status === 'RELEASED' ? 'SUBMITTED' : item.status,
      releaseStatus: item.status === 'RELEASED' ? 'RELEASED' : (item.releaseStatus || 'NOT_RELEASED'),
      revision: 1,
      examinerScorePct1dp: item.totalScore,
      totalScore: item.totalScore,
      
      // Timestamps - use submittedAt as the main date
      submittedAt: item.submittedAt,
      updatedAt: item.updatedAt,
      
      // Feedback and metadata (parsed)
      overallFeedback: item.overallFeedback,
      notes: item.overallFeedback, // Map overallFeedback to notes
      rubricMetaSnapshot: rubricMeta,
      rubricsInfoSnapshot: rubricsInfo,
      scoresJson: scores,
      
      // Rubric data for display
      rubricInfo: {
        meta: rubricMeta,
        criteria: rubricsInfo,
        scores: scores
      },
      
      // Editable flag
      isEditable: item.status === 'REOPENED' || item.status === 'DRAFT'
    };
  });
}

const examinerResultsServiceReal = {
  /**
   * Get paginated list of examiner's assessment results
   * @param {number} examinerId - The examiner's ID
   * @param {object} params - Query parameters for filtering and pagination
   * @returns {Promise} API response with paginated results
   */
  async listResults(examinerId, params = {}) {
    try {
      // Build filters for assessment list API
      const filters = {};
      
      // Map frontend parameters to backend filters
      if (params.status && params.status !== 'all') {
        filters.status = params.status;
      }
      if (params.q) {
        filters.search = params.q;
      }
      if (params.from) {
        filters.dateFrom = params.from;
      }
      if (params.to) {
        filters.dateTo = params.to;
      }

      
      const response = await examinerAssessmentService.getAssessmentsList(examinerId, filters);
      
      if (!response.success) {
        console.error('API response failed:', response);
        throw new Error(response.message || 'Failed to fetch assessments');
      }

      const { data } = response;
      
      // Handle assessment list API response format
      let items = [];
      
      if (Array.isArray(data)) {
        // Direct array response from getAssessmentsList
        console.log('Using direct array format from assessments list');
        items = data;
      } else if (data.items && Array.isArray(data.items)) {
        // Items array in data object
        console.log('Using items array format');
        items = data.items;
      } else if (data.submissionId) {
        // Single assessment object - wrap in array
        console.log('Using single object format, wrapping in array');
        items = [data];
      } else {
        console.warn('Unexpected data format:', data);
        items = data ? [data] : [];
      }
      
      // Transform items to match frontend expectations  
      const transformedItems = transformAssessmentItems(items);

      // Apply client-side filtering since backend may not support all filters
      let filteredItems = transformedItems;
      
      // Client-side search filter
      if (params.q && params.q.trim()) {
        const searchTerm = params.q.toLowerCase().trim();
        filteredItems = filteredItems.filter(item => {
          const searchableFields = [
            item.assignment?.name,
            item.assignment?.courseCode,
            item.assignment?.courseName,
            item.entity?.group?.groupName,
            item.entity?.student?.name,
            item.assessmentId,
            item.submissionId
          ].filter(Boolean).map(field => String(field).toLowerCase());
          
          return searchableFields.some(field => field.includes(searchTerm));
        });
      }
      
      // Client-side date range filter
      if (params.from || params.to) {
        const fromDate = params.from ? new Date(params.from + 'T00:00:00') : null;
        const toDate = params.to ? new Date(params.to + 'T23:59:59') : null;
        
        filteredItems = filteredItems.filter(item => {
          const itemDate = new Date(item.submittedAt);
          if (isNaN(itemDate.getTime())) return true; // Skip invalid dates
          
          if (fromDate && itemDate < fromDate) return false;
          if (toDate && itemDate > toDate) return false;
          return true;
        });
      }

      // Apply client-side pagination  
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const start = (page - 1) * pageSize;
      const paginatedItems = filteredItems.slice(start, start + pageSize);

      const finalResult = {
        success: true,
        code: 'OK',
        data: {
          page: page,
          pageSize: pageSize,
          total: filteredItems.length, // Use filtered count for pagination
          items: paginatedItems
        }
      };
      
      return finalResult;
    } catch (error) {
      console.error('Error in listResults:', error);
      return {
        success: false,
        code: 'ERROR',
        message: error.message || 'Failed to load results',
        data: { page: 1, pageSize: 20, total: 0, items: [] }
      };
    }
  },

  /**
   * Get detailed assessment result
   * @param {number} examinerId - The examiner's ID
   * @param {string} assessmentId - The assessment ID
   * @param {object} options - Additional options like version
   * @returns {Promise} API response with detailed result
   */
  async getResultDetail(examinerId, assessmentId, options = {}) {
    try {
      console.log('getResultDetail called with:', { examinerId, assessmentId, options });
      
      // Call the backend API directly to get raw data
      const response = await apiClient.get(
        `/api/examiner/assessments/${assessmentId}`,
        { params: { examinerId } }
      );
      
      console.log('getResultDetail raw API response:', response);
      
      // Extract data from response
      let assessmentData;
      if (response.data?.success && response.data?.data) {
        assessmentData = response.data.data;
      } else if (response.data?.submissionId) {
        assessmentData = response.data;
      } else {
        assessmentData = response.data;
      }
      
      if (!assessmentData) {
        throw new Error('No assessment data received from API');
      }
      
      console.log('Raw assessmentData:', assessmentData);
      
      // Parse JSON strings
      const rubricMeta = safeJsonParse(assessmentData.rubricMetaSnapshot, {});
      const rubricsInfo = safeJsonParse(assessmentData.rubricsInfoSnapshot, []);
      const scores = safeJsonParse(assessmentData.scoresJson, []);
      
      console.log('Parsed detail data:', { rubricMeta, rubricsInfo, scores });
      console.log('Assessment fields:', {
        submissionId: assessmentData.submissionId,
        assignmentId: assessmentData.assignmentId,
        sessionId: assessmentData.sessionId,
        subjectType: assessmentData.subjectType,
        subjectId: assessmentData.subjectId
      });

      // Transform to expected format for detail components
      const transformedDetail = {
        assessmentId: assessmentData.submissionId || assessmentData.assessmentId,
        submissionId: assessmentData.submissionId,
        assignmentId: assessmentData.assignmentId,
        sessionId: assessmentData.sessionId,
        
        // Assignment info
        assignment: {
          id: assessmentData.assignmentId || assessmentData.assignment?.id,
          name: rubricMeta.name || assessmentData.assignment?.name || 'Assignment',
          type: assessmentData.subjectType || assessmentData.assignment?.type || 'mixed',
          courseId: assessmentData.courseId || assessmentData.assignment?.courseId,
          courseCode: assessmentData.courseCode || assessmentData.assignment?.courseCode,
          courseName: assessmentData.courseName || assessmentData.assignment?.courseName,
          rubricMeta: rubricMeta
        },
        
        // Assessment status and scoring
        assessmentStatus: assessmentData.status,
        releaseStatus: assessmentData.releaseStatus || 'NOT_RELEASED',
        revision: 1,
        totalScore: assessmentData.totalScore,
        
        // Timestamps - ensure proper date format
        submittedAt: assessmentData.submittedAt,
        updatedAt: assessmentData.updatedAt,
        createdAt: assessmentData.submittedAt, // Fallback for missing createdAt
        
        // Feedback and rubric data (parsed)
        overallFeedback: assessmentData.overallFeedback,
        notes: assessmentData.overallFeedback,
        
        // Rubric structure for display
        rubricFrozen: {
          rubricId: `R-${assessmentData.assignmentId}`,
          version: 1,
          criteria: this.transformRubricCriteria(rubricsInfo),
          meta: rubricMeta
        },
        
        // Entity data
        entities: [this.transformEntityScores(assessmentData, rubricsInfo, scores)],
        
        // Session info for display
        session: {
          id: assessmentData.sessionId,
          start: assessmentData.submittedAt,
          end: assessmentData.updatedAt,
          timezone: 'Australia/Melbourne',
          durationMinutes: 45,
          venue: {
            venueId: 1,
            name: 'TBD',
            building: 'TBD',
            room: 'TBD'
          }
        },
        
        // Raw parsed data for components that need it
        rubricMetaSnapshot: rubricMeta,
        rubricsInfoSnapshot: rubricsInfo,
        scoresJson: scores
      };
      
      console.log('Final transformed detail:', transformedDetail);
      
      // Validate essential fields
      if (!transformedDetail.assignment?.name) {
        console.warn('Missing assignment name, using fallback');
        transformedDetail.assignment.name = 'Assignment';
      }
      
      if (!transformedDetail.entities?.[0]) {
        console.warn('Missing entity data');
      }

      return {
        success: true,
        code: 'OK',
        data: transformedDetail
      };
    } catch (error) {
      console.error('Error in getResultDetail:', error);
      return {
        success: false,
        code: 'ERROR',
        message: error.message || 'Failed to load result detail',
        data: null
      };
    }
  },

  /**
   * Transform rubric criteria from backend format to frontend format
   * @param {Array} rubricsInfo - Raw rubric info from backend
   * @returns {Array} Transformed criteria
   */
  transformRubricCriteria(rubricsInfo) {
    if (!Array.isArray(rubricsInfo)) {
      return [];
    }
    
    return rubricsInfo.map((criterion, index) => ({
      criterionId: `C${index + 1}`,
      text: criterion.description,
      weight: criterion.weight,
      weightPct: criterion.weight,
      appliesTo: 'BOTH',
      scaleType: criterion.scaleType,
      levels: (criterion.performanceLevel || []).map((level, levelIndex) => ({
        levelId: `L${levelIndex + 1}`,
        levelLabel: level.description,
        levelRange: {
          min: level.startPoint,
          max: level.endPoint
        },
        description: level.description
      }))
    }));
  },

  /**
   * Transform entity scores from backend data
   * @param {Object} assessmentData - Raw assessment data
   * @param {Array} rubricsInfo - Rubric criteria info
   * @param {Array} scores - Score data
   * @returns {Object} Transformed entity with scores
   */
  transformEntityScores(assessmentData, rubricsInfo, scores) {
    const entity = {
      kind: assessmentData.subjectType === 'GROUP' ? 'GROUP' : 'INDIVIDUAL',
      overallFeedback: assessmentData.overallFeedback,
      notes: assessmentData.overallFeedback,
      items: [],
      computed: {
        rawPoints: assessmentData.totalScore,
        examinerScorePct1dp: assessmentData.totalScore
      }
    };

    // Add entity-specific info
    if (assessmentData.subjectType === 'GROUP') {
      entity.groupId = assessmentData.subjectId;
      entity.groupName = assessmentData.groupName || `Group ${assessmentData.subjectId}`;
    } else {
      entity.studentId = assessmentData.subjectId;
      entity.studentName = assessmentData.studentName || `Student ${assessmentData.subjectId}`;
    }

    // Transform scores to match expected format
    if (Array.isArray(scores)) {
      entity.items = scores.map((score, index) => {
        const criterion = rubricsInfo[index];
        const item = {
          criterionId: `C${index + 1}`,
          points: score.inputPoints,
          comments: score.comment ? [{ source: 'custom', text: score.comment }] : []
        };

        // Handle level-based scoring
        if (score.selectedLevel && criterion?.performanceLevel) {
          // Find the correct levelId by matching the selectedLevel with criterion's performanceLevel
          const levelIndex = criterion.performanceLevel.findIndex(level => 
            level.description === score.selectedLevel.description &&
            level.startPoint === score.selectedLevel.startPoint &&
            level.endPoint === score.selectedLevel.endPoint
          );
          
          item.levelId = levelIndex >= 0 ? `L${levelIndex + 1}` : `L1`;
          item.levelLabel = score.selectedLevel.description;
          item.levelRange = {
            min: score.selectedLevel.startPoint,
            max: score.selectedLevel.endPoint
          };
          if (!item.points) {
            item.points = (score.selectedLevel.startPoint + score.selectedLevel.endPoint) / 2;
          }
        } else if (score.inputPoints && criterion?.performanceLevel) {
          // For points-based scoring, find the level that contains the points
          const level = criterion.performanceLevel.find(level => 
            score.inputPoints >= level.startPoint && score.inputPoints <= level.endPoint
          );
          if (level) {
            const levelIndex = criterion.performanceLevel.indexOf(level);
            item.levelId = `L${levelIndex + 1}`;
            item.levelLabel = level.description;
            item.levelRange = {
              min: level.startPoint,
              max: level.endPoint
            };
          }
        }

        return item;
      });
    }

    return entity;
  },

  /**
   * Get assessment versions/history
   * @param {number} examinerId - The examiner's ID
   * @param {string} assessmentId - The assessment ID
   * @returns {Promise} API response with versions list
   */
  async getResultVersions(examinerId, assessmentId) {
    try {
      // This would need to be implemented in the backend
      // For now, return a basic structure
      return {
        success: true,
        code: 'OK',
        data: {
          versions: [
            {
              version: 1,
              status: 'SUBMITTED',
              at: new Date().toISOString(),
              by: { role: 'EXAMINER', id: examinerId },
              summary: {
                examinerScorePct1dp: 0,
                entityKinds: ['INDIVIDUAL']
              }
            }
          ]
        }
      };
    } catch (error) {
      console.error('Error in getResultVersions:', error);
      return {
        success: false,
        code: 'ERROR',
        message: error.message || 'Failed to load versions',
        data: { versions: [] }
      };
    }
  },

  /**
   * Map frontend sort field to backend field
   * @param {string} frontendSort - Frontend sort field
   * @returns {string} Backend sort field
   */
  mapSortField(frontendSort) {
    const sortMap = {
      'sessionStart': 'updated_at',
      'assignmentName': 'created_at',
      'score': 'total_score',
      'submittedAt': 'submitted_at'
    };
    
    return sortMap[frontendSort] || 'updated_at';
  }
};

export const examinerResultsService = examinerResultsServiceReal;
export default examinerResultsServiceReal;
