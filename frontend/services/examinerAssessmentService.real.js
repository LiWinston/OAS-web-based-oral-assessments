/**
 * Real API Implementation for Examiner Assessment Service (TEMPLATE)
 * 
 * This file is prepared for backend integration.
 * When backend is ready:
 * 1. Delete examinerAssessmentService.mock.js
 * 2. Rename this file to examinerAssessmentService.js (replacing the current mock version)
 * 3. Remove all mock-related code
 * 
 * Following the API contract in Docs/API/Examiner-Assessment-API-Contracts.md
 */

import apiClient from './apiClient';

const examinerAssessmentServiceReal = {
  /**
   * Get all assessments for the current examiner
   * POST /api/examiner/assessments/list
   * 
   * @param {object} filters - Filter parameters for assessments
   * @returns {Promise} API response with assessments list
   */
  async getAssessmentsList(examinerId, filters = {}) {
    try {
      // Build payload with required examinerId
      const payload = {
        examinerId: Number(examinerId),
        ...filters
      };
      
      const response = await apiClient.post('/api/examiner/assessments/list', payload);
      return response.data;
    } catch (error) {
      console.error('Error fetching assessments list:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch assessments list',
        error: error.response?.data
      };
    }
  },

  /**
   * Get paginated assessments for results page
   * POST /api/examiner/assessments/page
   * 
   * @param {number} examinerId - The examiner ID
   * @param {object} filters - Filter and pagination parameters
   * @returns {Promise} API response with paginated assessments
   */
  async getAssessmentsPage(examinerId, filters = {}) {
    try {
      // 简化 payload，只保留基本的分页参数
      const payload = {
        page: filters.page || 0,
        limit: filters.limit || 20
      };
      
      console.log('Calling POST /api/examiner/assessments/page with payload:', payload);
      
      const response = await apiClient.post('/api/examiner/assessments/page', payload);
      return response.data;
    } catch (error) {
      console.error('Error fetching assessments page:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch assessments page',
        error: error.response?.data
      };
    }
  },

  /**
   * Get list of sessions to mark for an examiner
   * GET /api/examiners/{examinerId}/assignments/{assignmentId}/marking-sessions
   * 
   * @param {number} examinerId - The examiner's ID
   * @param {number} assignmentId - The assignment ID
   * @param {object} params - Query parameters (status, startDate, endDate, etc.)
   * @returns {Promise} API response with marking sessions
   */
  async getMarkingSessions(examinerId, assignmentId, params = {}) {
    try {
      const response = await apiClient.get(
        `/api/examiners/${examinerId}/assignments/${assignmentId}/marking-sessions`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching marking sessions:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch marking sessions',
        error: error.response?.data
      };
    }
  },

  /**
   * Get session context for marking or result detail
   * GET /api/examiner/assessments/{submissionId}
   * 
   * @param {number} submissionId - The submission ID 
   * @param {number} examinerId - The examiner's ID
   * @returns {Promise} API response with session context
   */
  async getSessionContext(submissionId, examinerId) {
    try {
      console.log(`getSessionContext: GET /api/examiner/assessments/${submissionId}?examinerId=${examinerId}`);
      
      // Get submission details from real backend
      const response = await apiClient.get(
        `/api/examiner/assessments/${submissionId}`,
        { params: { examinerId } }
      );
      
      console.log('getSessionContext raw response:', response);
      
      // Transform backend response to expected format
      let assessment;
      
      // Handle different response formats
      if (response.data?.success && response.data?.data) {
        assessment = response.data.data;
      } else if (response.data?.submissionId) {
        // Direct assessment object
        assessment = response.data;
      } else {
        // Fallback: return original response
      return response.data;
      }
        
      if (!assessment) {
        return {
          success: false,
          code: 'ERROR',
          message: 'No assessment data found'
        };
      }
      
      // Log basic info for debugging
      console.log('Loading assessment:', {
        submissionId: assessment.submissionId,
        sessionId: assessment.sessionId,
        assignmentId: assessment.assignmentId
      });
        
      // Parse JSON strings from backend
      let rubricMeta = {};
      let rubricsInfo = [];
      let scores = [];
      
      try {
        if (assessment.rubricMetaSnapshot) {
          rubricMeta = JSON.parse(assessment.rubricMetaSnapshot);
        }
      } catch (e) {
        console.warn('Failed to parse rubricMetaSnapshot:', e);
      }
      
      try {
        if (assessment.rubricsInfoSnapshot) {
          const parsed = JSON.parse(assessment.rubricsInfoSnapshot);
          // Handle different formats: direct array or object with criteria property
          if (Array.isArray(parsed)) {
            rubricsInfo = parsed;
          } else if (parsed && Array.isArray(parsed.criteria)) {
            rubricsInfo = parsed.criteria;
          } else {
            console.warn('rubricsInfoSnapshot is not in expected format:', parsed);
            rubricsInfo = [];
          }
        }
      } catch (e) {
        console.warn('Failed to parse rubricsInfoSnapshot:', e);
        rubricsInfo = [];
      }
      
      try {
        if (assessment.scoresJson) {
          const parsed = JSON.parse(assessment.scoresJson);
          // Ensure scores is an array
          if (Array.isArray(parsed)) {
            scores = parsed;
          } else {
            console.warn('scoresJson is not an array:', parsed);
            scores = [];
          }
        }
      } catch (e) {
        console.warn('Failed to parse scoresJson:', e);
        scores = [];
      }
      
      // Build session context in expected format
      const sessionContext = {
        submissionId: assessment.submissionId,
        sessionId: assessment.sessionId || null, // 🔥 添加真实的sessionId，如果没有则为null
        assignment: {
          id: assessment.assignmentId,
          name: rubricMeta.name || `Assignment ${assessment.assignmentId}`,
          type: assessment.subjectType?.toLowerCase() === 'group' ? 'group' : 'individual',
          rubric: {
            id: `rubric-${assessment.assignmentId}`,
            criteria: Array.isArray(rubricsInfo) ? rubricsInfo.map((criterion, index) => ({
              criterionId: `C${index + 1}`,
              description: criterion?.description || 'Criterion',
              weight: criterion?.weight || 0,
              scaleType: criterion?.scaleType || 'points',
              appliesTo: 'BOTH',
              // Provide both field names for compatibility
              levels: Array.isArray(criterion?.performanceLevel) ? criterion.performanceLevel.map((level, levelIndex) => ({
                levelId: `L${levelIndex + 1}`,
                minPoints: level?.startPoint || 0,
                maxPoints: level?.endPoint || 100,
                description: level?.description || 'Level'
              })) : [],
              performanceLevel: Array.isArray(criterion?.performanceLevel) ? criterion.performanceLevel.map((level, levelIndex) => ({
                levelId: `L${levelIndex + 1}`,
                startPoint: level?.startPoint || 0,
                endPoint: level?.endPoint || 100,
                description: level?.description || 'Level'
              })) : []
            })) : []
          }
        },
        entity: {
          kind: assessment.subjectType || 'INDIVIDUAL',
          ...(assessment.subjectType === 'GROUP' ? {
            groupId: `G-${assessment.subjectId}`,
            groupName: `Group ${assessment.subjectId}`,
            members: 1 // This should come from backend if available
          } : {
            individuals: [{
              studentId: assessment.subjectId,
              name: `Student ${assessment.subjectId}`
            }]
          })
        },
        predefinedComments: {},
        existingAssessment: assessment.status !== 'unmarked' ? {
          assessmentId: `A-${assessment.submissionId}`,
          status: assessment.status?.toUpperCase() || 'DRAFT',
          submittedAt: assessment.submittedAt,
          totalScore: assessment.totalScore,
          overallFeedback: assessment.overallFeedback,
          // Convert scores back to entities format for useAssessmentDraft
          entities: [{
            kind: assessment.subjectType || 'INDIVIDUAL',
            ...(assessment.subjectType === 'GROUP' ? {
              items: scores.map((score, index) => {
                // Find the criterion index to get the correct criterionId
                const criterionIndex = rubricsInfo.findIndex(c => c.description === score.description);
                const criterionId = criterionIndex >= 0 ? `C${criterionIndex + 1}` : `C${index + 1}`;
                
                // Find levelId from selectedLevel or points
                let levelId = null;
                const criterion = rubricsInfo[criterionIndex];
                
                console.log('DEBUG existingAssessment GROUP - Converting score:', {
                  scoreDescription: score.description,
                  criterionIndex,
                  criterionId,
                  hasSelectedLevel: !!score.selectedLevel,
                  selectedLevelDescription: score.selectedLevel?.description,
                  hasInputPoints: score.inputPoints !== undefined && score.inputPoints !== null,
                  inputPoints: score.inputPoints,
                  criterionPerformanceLevels: criterion?.performanceLevel?.map(l => ({ 
                    levelId: l.levelId, 
                    description: l.description 
                  }))
                });
                
                if (score.selectedLevel) {
                  // For descriptive scales: find level by description match
                  if (criterion?.performanceLevel) {
                    const level = criterion.performanceLevel.find(l => l.description === score.selectedLevel.description);
                    console.log('DEBUG existingAssessment GROUP - Found level by description:', { 
                      targetDescription: score.selectedLevel.description,
                      foundLevel: level,
                      levelProps: level ? Object.keys(level) : 'no level found'
                    });
                    
                    // The performanceLevel has real levelId, but we need to map it properly
                    if (level) {
                      // If level has levelId field, use it directly
                      if (level.levelId) {
                        levelId = level.levelId;
                      } else {
                        // Otherwise, find the corresponding level in criterion.levels by description
                        // Can't use sessionContext here as it's still being constructed
                        // Instead, construct levelId directly from performanceLevel index
                        const performanceLevelIndex = criterion.performanceLevel.findIndex(l => l.description === level.description);
                        levelId = performanceLevelIndex >= 0 ? `L${performanceLevelIndex + 1}` : null;
                      }
                    }
                    
                    console.log('DEBUG existingAssessment GROUP - Level ID extraction:', { 
                      levelId_field: level?.levelId,
                      level_description: level?.description,
                      finalLevelId: levelId
                    });
                  }
                } else if (score.inputPoints !== undefined && score.inputPoints !== null) {
                  // For points scales: find level by points range
                  if (criterion?.performanceLevel) {
                    const level = criterion.performanceLevel.find(l => 
                      score.inputPoints >= l.startPoint && score.inputPoints <= l.endPoint
                    );
                    console.log('DEBUG existingAssessment GROUP - Found level by points:', { 
                      targetPoints: score.inputPoints,
                      foundLevel: level,
                      levelProps: level ? Object.keys(level) : 'no level found'
                    });
                    
                    // The performanceLevel has real levelId, but we need to map it properly
                    if (level) {
                      // If level has levelId field, use it directly
                      if (level.levelId) {
                        levelId = level.levelId;
                      } else {
                        // Otherwise, find the corresponding level in criterion.levels by description
                        // Can't use sessionContext here as it's still being constructed
                        // Instead, construct levelId directly from performanceLevel index
                        const performanceLevelIndex = criterion.performanceLevel.findIndex(l => l.description === level.description);
                        levelId = performanceLevelIndex >= 0 ? `L${performanceLevelIndex + 1}` : null;
                      }
                    }
                    
                    console.log('DEBUG existingAssessment GROUP - Level ID extraction:', { 
                      levelId_field: level?.levelId,
                      level_description: level?.description,
                      finalLevelId: levelId
                    });
                  }
                }
                
                // Build result item based on scale type
                let itemPoints = 0;
                
                if (score.inputPoints !== undefined && score.inputPoints !== null) {
                  // For points-based scales, use the actual inputPoints
                  itemPoints = score.inputPoints;
                } else if (score.selectedLevel && levelId) {
                  // For descriptive scales, calculate points from selectedLevel
                  const selectedLevel = score.selectedLevel;
                  if (selectedLevel.startPoint !== undefined && selectedLevel.endPoint !== undefined) {
                    // Use the midpoint of the range as the points value
                    itemPoints = (selectedLevel.startPoint + selectedLevel.endPoint) / 2;
                  }
                }
                
                const resultItem = {
                  criterionId,
                  levelId,
                  points: itemPoints,
                  comments: score.comment ? [{ text: score.comment }] : []
                };
                
                console.log('DEBUG existingAssessment GROUP - Final item:', resultItem);
                
                return resultItem;
              }),
              overallFeedback: assessment.overallFeedback || '',
              notes: assessment.adminNote || ''
            } : {
              studentId: assessment.subjectId,
              items: scores.map((score, index) => {
                // Find the criterion index to get the correct criterionId  
                const criterionIndex = rubricsInfo.findIndex(c => c.description === score.description);
                const criterionId = criterionIndex >= 0 ? `C${criterionIndex + 1}` : `C${index + 1}`;
                
                // Find levelId from selectedLevel or points
                let levelId = null;
                const criterion = rubricsInfo[criterionIndex];
                
                if (score.selectedLevel) {
                  // For descriptive scales: find level by description match
                  if (criterion?.performanceLevel) {
                    const level = criterion.performanceLevel.find(l => l.description === score.selectedLevel.description);
                    // Map to proper levelId
                    if (level) {
                      if (level.levelId) {
                        levelId = level.levelId;
                      } else {
                        // Can't use sessionContext here as it's still being constructed
                        // Instead, construct levelId directly from performanceLevel index
                        const performanceLevelIndex = criterion.performanceLevel.findIndex(l => l.description === level.description);
                        levelId = performanceLevelIndex >= 0 ? `L${performanceLevelIndex + 1}` : null;
                      }
                    }
                  }
                } else if (score.inputPoints !== undefined && score.inputPoints !== null) {
                  // For points scales: find level by points range
                  if (criterion?.performanceLevel) {
                    const level = criterion.performanceLevel.find(l => 
                      score.inputPoints >= l.startPoint && score.inputPoints <= l.endPoint
                    );
                    // Map to proper levelId
                    if (level) {
                      if (level.levelId) {
                        levelId = level.levelId;
                      } else {
                        // Can't use sessionContext here as it's still being constructed
                        // Instead, construct levelId directly from performanceLevel index
                        const performanceLevelIndex = criterion.performanceLevel.findIndex(l => l.description === level.description);
                        levelId = performanceLevelIndex >= 0 ? `L${performanceLevelIndex + 1}` : null;
                      }
                    }
                  }
                }
                
                // Build result item based on scale type
                let itemPoints = 0;
                
                if (score.inputPoints !== undefined && score.inputPoints !== null) {
                  // For points-based scales, use the actual inputPoints
                  itemPoints = score.inputPoints;
                } else if (score.selectedLevel && levelId) {
                  // For descriptive scales, calculate points from selectedLevel
                  const selectedLevel = score.selectedLevel;
                  if (selectedLevel.startPoint !== undefined && selectedLevel.endPoint !== undefined) {
                    // Use the midpoint of the range as the points value
                    itemPoints = (selectedLevel.startPoint + selectedLevel.endPoint) / 2;
                  }
                }
                
                const resultItem = {
                  criterionId,
                  levelId,
                  points: itemPoints,
                  comments: score.comment ? [{ text: score.comment }] : []
                };
                
                return resultItem;
              })
            })
          }]
        } : null
      };
      
      console.log('DEBUG - Constructed criteria structure:', sessionContext.assignment.rubric.criteria);
      console.log('DEBUG - Constructed existingAssessment:', sessionContext.existingAssessment);
      
      return {
        success: true,
        code: 'OK',
        data: sessionContext
      };
    } catch (error) {
      console.error('Error fetching session context:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch session context',
        error: error.response?.data
      };
    }
  },

  /**
   * Save draft assessment
   * POST /api/examiner/assessments/draft/save
   * 
   * @param {number} submissionId - The submission ID
   * @param {object} assessmentData - The assessment data to save
   * @returns {Promise} API response with saved assessment info
   */
  async saveDraft(submissionId, assessmentData) {
    try {
      // Get context information
      const sessionContext = assessmentData.sessionContext;
      const isGroup = sessionContext?.entity?.kind === 'GROUP';
      const subjectType = isGroup ? 'GROUP' : 'INDIVIDUAL';
      const subjectId = isGroup 
        ? (sessionContext?.entity?.groupId?.replace('G-', '') || 1)
        : (sessionContext?.entity?.individuals?.[0]?.studentId || 1);


      // Convert entities to scores format expected by backend
      const scores = [];
      if (assessmentData.entities && Array.isArray(assessmentData.entities)) {
        assessmentData.entities.forEach(entity => {
          if (entity.items && Array.isArray(entity.items)) {
            entity.items.forEach(item => {
              // Find the criterion info from rubric to get proper details
              const criterion = sessionContext?.assignment?.rubric?.criteria?.find(
                c => c.criterionId === item.criterionId
              );
              
              // Get the selected level details from the criterion's performance levels
              let selectedLevel = null;
              
              // Debug: Log the search process
              console.log('🔍 SEARCH - Looking for selectedLevel:', {
                criterionId: item.criterionId,
                levelId: item.levelId,
                points: item.points,
                availableLevels: criterion?.performanceLevel?.map(l => ({
                  levelId: l.levelId,
                  description: l.description,
                  range: `${l.startPoint}-${l.endPoint}`
                }))
              });
              
              
              if (criterion?.performanceLevel && Array.isArray(criterion.performanceLevel)) {
                // Strategy 1: Find by levelId field
                if (item.levelId) {
                  selectedLevel = criterion.performanceLevel.find(level => level.levelId === item.levelId);
                  console.log('🔍 Strategy 1 (levelId):', { found: !!selectedLevel, searched: item.levelId });
                  
                  // Strategy 2: Find by description as fallback
                  if (!selectedLevel) {
                    selectedLevel = criterion.performanceLevel.find(level => level.description === item.levelId);
                    console.log('🔍 Strategy 2 (description):', { found: !!selectedLevel, searched: item.levelId });
                  }
                }
                
                // Strategy 3: Find by points range (always try as backup)
                if (!selectedLevel && item.points !== undefined && item.points !== null) {
                  selectedLevel = criterion.performanceLevel.find(level => 
                    item.points >= level.startPoint && item.points <= level.endPoint
                  );
                  console.log('🔍 Strategy 3 (points range):', { found: !!selectedLevel, points: item.points });
                }
                
                // Strategy 4: Find closest match by distance if still not found
                if (!selectedLevel && item.points !== undefined && item.points !== null) {
                  let closestLevel = null;
                  let minDistance = Infinity;
                  
                  criterion.performanceLevel.forEach(level => {
                    const midPoint = (level.startPoint + level.endPoint) / 2;
                    const distance = Math.abs(item.points - midPoint);
                    if (distance < minDistance) {
                      minDistance = distance;
                      closestLevel = level;
                    }
                  });
                  
                  selectedLevel = closestLevel;
                  console.log('🔍 Strategy 4 (closest match):', { found: !!selectedLevel, points: item.points, closest: closestLevel?.description });
                }
              }
              
              console.log('🔍 FINAL RESULT - selectedLevel:', selectedLevel ? {
                description: selectedLevel.description,
                range: `${selectedLevel.startPoint}-${selectedLevel.endPoint}`
              } : 'NULL - This will cause the error!');
              
              // Build score entry - all criteria now include both selectedLevel and inputPoints
              const baseEntry = {
                description: criterion?.description || '',
                scaleType: criterion?.scaleType || 'points',
                weight: criterion?.weight || 0,
                comment: item.comments && item.comments.length > 0 ? item.comments[0].text : ''
              };

              // All scale types now include both selectedLevel and inputPoints
              const scoreEntry = {
                ...baseEntry,
                inputPoints: item.points || 0,
                selectedLevel: selectedLevel ? {
                  description: selectedLevel.description,
                  startPoint: selectedLevel.startPoint,
                  endPoint: selectedLevel.endPoint
                } : null
              };
              scores.push(scoreEntry);
            });
          }
        });
      }

      // Build the request payload matching backend API format for Save Draft
      // Note: Save Draft does NOT include submissionId
      // Use sessionId from route parameters (passed as submissionId parameter) instead of API response
      const payload = {
        assignmentId: assessmentData.assignmentId || sessionContext?.assignment?.id || 0,
        sessionId: assessmentData.sessionId || sessionContext?.sessionId || 0,
        subjectType: subjectType,
        subjectId: Number(subjectId),
        overallFeedback: assessmentData.overallFeedback || '',
        adminNote: assessmentData.privateNotes || '', // Backend expects adminNote, not privateNote
        scores: scores
      };
      
      const response = await apiClient.post(
        `/api/examiner/assessments/draft/save`,
        payload
      );
      
      // Ensure consistent response format
      if (response.data?.success) {
        return {
          success: true,
          code: 'OK',
          data: {
            assessmentId: response.data.data?.assessmentId || `A-${submissionId}-${Date.now()}`,
            status: 'DRAFT',
            submissionId: submissionId
          }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error saving draft:', error);
      console.error('Error response:', error.response?.data);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to save draft',
        error: error.response?.data
      };
    }
  },

  /**
   * Submit assessment (finalize)
   * POST /api/examiner/assessments/submit
   * 
   * @param {number} submissionId - The submission ID
   * @param {object} assessmentData - The assessment data including assessmentId
   * @returns {Promise} API response with submission confirmation
   */
  async submitAssessment(submissionId, assessmentData) {
    try {
      // Get context information
      const sessionContext = assessmentData.sessionContext;
      const isGroup = sessionContext?.entity?.kind === 'GROUP';
      const subjectType = isGroup ? 'GROUP' : 'INDIVIDUAL';
      const subjectId = isGroup 
        ? (sessionContext?.entity?.groupId?.replace('G-', '') || 1)
        : (sessionContext?.entity?.individuals?.[0]?.studentId || 1);

      // Convert entities to scores format expected by backend
      const scores = [];
      if (assessmentData.entities && Array.isArray(assessmentData.entities)) {
        assessmentData.entities.forEach(entity => {
          if (entity.items && Array.isArray(entity.items)) {
            entity.items.forEach(item => {
              // Find the criterion info from rubric to get proper details
              const criterion = sessionContext?.assignment?.rubric?.criteria?.find(
                c => c.criterionId === item.criterionId
              );
              
              // Get the selected level details from the criterion's performance levels
              let selectedLevel = null;
              
              // Debug: Log the search process
              console.log('🔍 SEARCH - Looking for selectedLevel:', {
                criterionId: item.criterionId,
                levelId: item.levelId,
                points: item.points,
                availableLevels: criterion?.performanceLevel?.map(l => ({
                  levelId: l.levelId,
                  description: l.description,
                  range: `${l.startPoint}-${l.endPoint}`
                }))
              });
              
              
              if (criterion?.performanceLevel && Array.isArray(criterion.performanceLevel)) {
                // Strategy 1: Find by levelId field
                if (item.levelId) {
                  selectedLevel = criterion.performanceLevel.find(level => level.levelId === item.levelId);
                  console.log('🔍 Strategy 1 (levelId):', { found: !!selectedLevel, searched: item.levelId });
                  
                  // Strategy 2: Find by description as fallback
                  if (!selectedLevel) {
                    selectedLevel = criterion.performanceLevel.find(level => level.description === item.levelId);
                    console.log('🔍 Strategy 2 (description):', { found: !!selectedLevel, searched: item.levelId });
                  }
                }
                
                // Strategy 3: Find by points range (always try as backup)
                if (!selectedLevel && item.points !== undefined && item.points !== null) {
                  selectedLevel = criterion.performanceLevel.find(level => 
                    item.points >= level.startPoint && item.points <= level.endPoint
                  );
                  console.log('🔍 Strategy 3 (points range):', { found: !!selectedLevel, points: item.points });
                }
                
                // Strategy 4: Find closest match by distance if still not found
                if (!selectedLevel && item.points !== undefined && item.points !== null) {
                  let closestLevel = null;
                  let minDistance = Infinity;
                  
                  criterion.performanceLevel.forEach(level => {
                    const midPoint = (level.startPoint + level.endPoint) / 2;
                    const distance = Math.abs(item.points - midPoint);
                    if (distance < minDistance) {
                      minDistance = distance;
                      closestLevel = level;
                    }
                  });
                  
                  selectedLevel = closestLevel;
                  console.log('🔍 Strategy 4 (closest match):', { found: !!selectedLevel, points: item.points, closest: closestLevel?.description });
                }
              }
              
              console.log('🔍 FINAL RESULT - selectedLevel:', selectedLevel ? {
                description: selectedLevel.description,
                range: `${selectedLevel.startPoint}-${selectedLevel.endPoint}`
              } : 'NULL - This will cause the error!');
              
              // Build score entry - all criteria now include both selectedLevel and inputPoints
              const baseEntry = {
                description: criterion?.description || '',
                scaleType: criterion?.scaleType || 'points',
                weight: criterion?.weight || 0,
                comment: item.comments && item.comments.length > 0 ? item.comments[0].text : ''
              };

              // All scale types now include both selectedLevel and inputPoints
              const scoreEntry = {
                ...baseEntry,
                inputPoints: item.points || 0,
                selectedLevel: selectedLevel ? {
                  description: selectedLevel.description,
                  startPoint: selectedLevel.startPoint,
                  endPoint: selectedLevel.endPoint
                } : null
              };
              scores.push(scoreEntry);
            });
          }
        });
      }

      // Build the request payload matching backend API format for Complete Assessment
      const payload = {
        submissionId: Number(submissionId),
        assignmentId: assessmentData.assignmentId || sessionContext?.assignment?.id || 0,
        sessionId: sessionContext?.sessionId || 0,
        subjectType: subjectType,
        subjectId: Number(subjectId),
        overallFeedback: assessmentData.overallFeedback || '',
        adminNote: assessmentData.privateNotes || '', // Backend expects adminNote, not privateNote
        scores: scores
      };

      
      const response = await apiClient.post(
        `/api/examiner/assessments/submit`,
        payload
      );
      
      // Ensure consistent response format
      if (response.data?.success) {
        return {
          success: true,
          code: 'OK',
          data: {
            assessmentId: response.data.data?.assessmentId || payload.assessmentId,
            status: 'SUBMITTED',
            submissionId: submissionId,
            submittedAt: new Date().toISOString()
          }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error submitting assessment:', error);
      console.error('Error response:', error.response?.data);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to submit assessment',
        error: error.response?.data
      };
    }
  },

  /**
   * Get current examiner's assessment
   * GET /api/marking/sessions/{sessionId}/assessments
   * 
   * @param {number} sessionId - The session ID
   * @param {number} examinerId - The examiner's ID
   * @returns {Promise} API response with assessment data
   */
  async getExaminerAssessment(sessionId, examinerId) {
    try {
      const response = await apiClient.get(
        `/api/marking/sessions/${sessionId}/assessments`,
        { params: { examinerId } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching examiner assessment:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch assessment',
        error: error.response?.data
      };
    }
  },

  /**
   * Get predefined comments for a criterion and level
   * GET /api/assignments/{assignmentId}/rubric/comments
   * 
   * @param {number} assignmentId - The assignment ID
   * @param {string} criterionId - The criterion ID
   * @param {string} levelId - The level ID
   * @returns {Promise} API response with predefined comments
   */
  async getPredefinedComments(assignmentId, criterionId, levelId) {
    try {
      const response = await apiClient.get(
        `/api/assignments/${assignmentId}/rubric/comments`,
        { params: { criterionId, levelId } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching predefined comments:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch comments',
        error: error.response?.data
      };
    }
  },

  /**
   * Add predefined comment
   * POST /api/assignments/{assignmentId}/rubric/comments
   * 
   * @param {number} assignmentId - The assignment ID
   * @param {string} criterionId - The criterion ID
   * @param {string} levelId - The level ID
   * @param {string} text - The comment text
   * @returns {Promise} API response with new comment
   */
  async addPredefinedComment(assignmentId, criterionId, levelId, text) {
    try {
      const response = await apiClient.post(
        `/api/assignments/${assignmentId}/rubric/comments`,
        { criterionId, levelId, text }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding predefined comment:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to add comment',
        error: error.response?.data
      };
    }
  },

  /**
   * Reopen submission (Admin only)
   * POST /api/marking/sessions/{sessionId}/assessments/{assessmentId}:reopen
   * 
   * @param {number} sessionId - The session ID
   * @param {string} assessmentId - The assessment ID
   * @returns {Promise} API response with reopened status
   */
  async reopenAssessment(sessionId, assessmentId) {
    try {
      const response = await apiClient.post(
        `/api/marking/sessions/${sessionId}/assessments/${assessmentId}:reopen`
      );
      return response.data;
    } catch (error) {
      console.error('Error reopening assessment:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to reopen assessment',
        error: error.response?.data
      };
    }
  },

  /**
   * Compute totals (optional server-side helper)
   * POST /api/marking/assessments/{assessmentId}:compute
   * 
   * @param {string} assessmentId - The assessment ID
   * @returns {Promise} API response with computation status
   */
  async computeTotals(assessmentId) {
    try {
      const response = await apiClient.post(
        `/api/marking/assessments/${assessmentId}:compute`
      );
      return response.data;
    } catch (error) {
      console.error('Error computing totals:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to compute totals',
        error: error.response?.data
      };
    }
  },

  /**
   * Get all assessments for a session (for viewing co-examiner marks)
   * GET /api/marking/sessions/{sessionId}/all-assessments
   * 
   * @param {number} sessionId - The session ID
   * @returns {Promise} API response with all assessments
   */
  async getAllAssessments(sessionId) {
    try {
      const response = await apiClient.get(
        `/api/marking/sessions/${sessionId}/all-assessments`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching all assessments:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch all assessments',
        error: error.response?.data
      };
    }
  },

  /**
   * Export assessment results
   * GET /api/assignments/{assignmentId}/export
   * 
   * @param {number} assignmentId - The assignment ID
   * @param {string} format - Export format (csv, pdf, excel)
   * @returns {Promise} File download
   */
  async exportResults(assignmentId, format = 'csv') {
    try {
      const response = await apiClient.get(
        `/api/assignments/${assignmentId}/export`,
        { 
          params: { format },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assessment-results-${assignmentId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, code: 'OK' };
    } catch (error) {
      console.error('Error exporting results:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to export results',
        error: error.response?.data
      };
    }
  }
};

export default examinerAssessmentServiceReal;