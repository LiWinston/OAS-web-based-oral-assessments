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

// Helper to unify group and individual rubric items into the new scores payload format
const buildUnifiedScores = ({
  entities = [],
  rubricCriteria = [],
  absentStudentIds = [],
  individualsList = [],
}) => {
  const scoresPayload = [];
  const absentSet = new Set(
    Array.isArray(absentStudentIds)
      ? absentStudentIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
      : []
  );
  const processedIndividuals = new Set();

  const getCriterion = (criterionId) =>
    rubricCriteria.find((rc) => rc.criterionId === criterionId);

  const appliesTo = (criterion) => (criterion?.appliesTo || 'BOTH').toUpperCase();

  const isGroupCriterion = (criterion) => {
    const target = appliesTo(criterion);
    return target === 'GROUP' || target === 'BOTH';
  };

  const isIndividualCriterion = (criterion) => {
    const target = appliesTo(criterion);
    return target === 'INDIVIDUAL' || target === 'BOTH';
  };

  const buildScoreEntry = (criterion, item) => {
    const levels = Array.isArray(criterion?.performanceLevel)
      ? criterion.performanceLevel
      : [];
    let selectedLevel = null;

    if (item?.levelId) {
      selectedLevel =
        levels.find((l) => l.levelId === item.levelId) ||
        levels.find((l) => l.description === item.levelId) ||
        null;
    }

    const numericPoints = Number(item?.points ?? item?.inputPoints ?? 0);

    if (!selectedLevel && Number.isFinite(numericPoints)) {
      selectedLevel =
        levels.find(
          (l) =>
            numericPoints >= Number(l.startPoint ?? l.minPoints ?? 0) &&
            numericPoints <= Number(l.endPoint ?? l.maxPoints ?? numericPoints)
        ) || null;
    }

    if (!selectedLevel && Number.isFinite(numericPoints) && levels.length) {
      selectedLevel =
        levels.reduce((best, l) => {
          const mid = (Number(l.startPoint ?? 0) + Number(l.endPoint ?? 0)) / 2;
          const distance = Math.abs(numericPoints - mid);
          if (!best || distance < best.distance) {
            return { level: l, distance };
          }
          return best;
        }, null)?.level || null;
    }

    const primaryComment = Array.isArray(item?.comments) && item.comments.length > 0
      ? String(item.comments[0]?.text ?? item.comments[0] ?? '')
      : '';

    return {
      description: criterion?.description || '',
      scaleType: criterion?.scaleType || 'points',
      weight: Number(criterion?.weight) || 0,
      inputPoints: Number.isFinite(numericPoints) ? numericPoints : 0,
      selectedLevel: selectedLevel
        ? {
            description: selectedLevel.description,
            startPoint: Number(selectedLevel.startPoint ?? selectedLevel.minPoints ?? 0),
            endPoint: Number(selectedLevel.endPoint ?? selectedLevel.maxPoints ?? 0),
          }
        : null,
      comment: primaryComment,
    };
  };

  const buildAbsentScoreEntry = (criterion) => {
    const levels = Array.isArray(criterion?.performanceLevel)
      ? criterion.performanceLevel
      : [];
    const lowest = levels.reduce((best, current) => {
      const currentStart = Number(current.startPoint ?? current.minPoints ?? 0);
      if (!best) return current;
      const bestStart = Number(best.startPoint ?? best.minPoints ?? 0);
      return currentStart < bestStart ? current : best;
    }, null);

    return {
      description: criterion?.description || '',
      scaleType: criterion?.scaleType || 'points',
      weight: Number(criterion?.weight) || 0,
      inputPoints: 0,
      selectedLevel: lowest
        ? {
            description: lowest.description,
            startPoint: Number(lowest.startPoint ?? lowest.minPoints ?? 0),
            endPoint: Number(lowest.endPoint ?? lowest.maxPoints ?? 0),
          }
        : null,
      comment: '',
    };
  };

  const pushGroupScore = (score) => {
    scoresPayload.push({
      type: 'GROUP',
      ...score,
    });
  };

  const pushIndividualScore = (studentId, score, individualFeedback = '') => {
    const normalizedId = Number(studentId);
    if (!Number.isFinite(normalizedId)) return;
    scoresPayload.push({
      type: 'INDIVIDUAL',
      studentId: normalizedId,
      individualFeedback: individualFeedback || '',
      ...score,
    });
  };

  const addAbsentIndividualScores = (studentId) => {
    const individualCriteria = rubricCriteria.filter((criterion) =>
      isIndividualCriterion(criterion)
    );
    individualCriteria.forEach((criterion) => {
      const score = buildAbsentScoreEntry(criterion);
      pushIndividualScore(studentId, score, 'ABSENT');
    });
  };

  const defaultIndividuals = Array.isArray(individualsList) ? individualsList : [];

  const groupEntity = entities.find((entity) => (entity?.kind || '').toUpperCase() === 'GROUP');
  if (groupEntity?.items?.length) {
    groupEntity.items.forEach((item) => {
      const criterion = getCriterion(item?.criterionId);
      if (!criterion || !isGroupCriterion(criterion)) return;
      const score = buildScoreEntry(criterion, item);
      pushGroupScore(score);
    });
  }

  entities
    .filter((entity) => (entity?.kind || '').toUpperCase() === 'INDIVIDUAL')
    .forEach((entity) => {
      const studentId = Number(entity?.studentId);
      if (!Number.isFinite(studentId)) return;
      processedIndividuals.add(studentId);
      const isAbsent = absentSet.has(studentId);
      if (isAbsent) {
        addAbsentIndividualScores(studentId);
        return;
      }

      const individualFeedback = String(
        entity?.individualFeedback ?? entity?.overallFeedback ?? entity?.notes ?? ''
      ).trim();

      const items = Array.isArray(entity?.items) ? entity.items : [];
      items.forEach((item) => {
        const criterion = getCriterion(item?.criterionId);
        if (!criterion || !isIndividualCriterion(criterion)) return;
        const score = buildScoreEntry(criterion, item);
        pushIndividualScore(studentId, score, individualFeedback);
      });
    });

  defaultIndividuals.forEach((student) => {
    const studentId = Number(student?.studentId ?? student?.id);
    if (!Number.isFinite(studentId)) return;
    if (!absentSet.has(studentId) || processedIndividuals.has(studentId)) return;
    addAbsentIndividualScores(studentId);
  });

  return scoresPayload;
};

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
      // Simplify payload: keep only basic pagination parameters
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
      console.error('Error fetching marking timeslots:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch marking timeslots',
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
      let scores = [];
      
      try {
        if (assessment.rubricMetaSnapshot) {
          rubricMeta = JSON.parse(assessment.rubricMetaSnapshot);
        }
      } catch (e) {
        console.warn('Failed to parse rubricMetaSnapshot:', e);
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
      
      // Build criteria from rubric meta
      const mapLevels = (levels = []) => (Array.isArray(levels) ? levels.map((lvl, i) => ({
        levelId: lvl.levelId || `L${i + 1}`,
        startPoint: Number(lvl.startPoint ?? lvl.minPoints ?? 0),
        endPoint: Number(lvl.endPoint ?? lvl.maxPoints ?? 0),
        description: lvl.description || `Level ${i + 1}`,
        preDefinedComment: Array.isArray(lvl.preDefinedComment) ? lvl.preDefinedComment : [],
      })) : []);
      const individualRubrics = Array.isArray(rubricMeta?.individualRubrics) ? rubricMeta.individualRubrics : [];
      const groupRubrics = Array.isArray(rubricMeta?.groupRubrics) ? rubricMeta.groupRubrics : [];
      const criteria = [];
      let criterionCounter = 0;
      groupRubrics.forEach((c) => {
        criterionCounter += 1;
        const pl = mapLevels(c.performanceLevel);
        criteria.push({
          criterionId: `C${criterionCounter}`,
          description: c.description || `Criterion ${criterionCounter}`,
          weight: Number(c.weight) || 0,
          scaleType: c.scaleType || 'points',
          appliesTo: 'GROUP',
          levels: pl.map((l) => ({
            levelId: l.levelId,
            minPoints: l.startPoint,
            maxPoints: l.endPoint,
            description: l.description,
            preDefinedComment: l.preDefinedComment,
          })),
          performanceLevel: pl,
        });
      });
      individualRubrics.forEach((c) => {
        criterionCounter += 1;
        const pl = mapLevels(c.performanceLevel);
        criteria.push({
          criterionId: `C${criterionCounter}`,
          description: c.description || `Criterion ${criterionCounter}`,
          weight: Number(c.weight) || 0,
          scaleType: c.scaleType || 'points',
          appliesTo: 'INDIVIDUAL',
          levels: pl.map((l) => ({
            levelId: l.levelId,
            minPoints: l.startPoint,
            maxPoints: l.endPoint,
            description: l.description,
            preDefinedComment: l.preDefinedComment,
          })),
          performanceLevel: pl,
        });
      });

      const sessionContext = {
        submissionId: assessment.submissionId,
        sessionId: assessment.sessionId || null, // Add real sessionId if available; otherwise null
        assignment: {
          id: assessment.assignmentId,
          name: rubricMeta.name || `Assignment ${assessment.assignmentId}`,
          rubric: {
            id: `rubric-${assessment.assignmentId}`,
            criteria: criteria,
            weightBasis: (rubricMeta?.weightBasis === 'points' || rubricMeta?.weightBasis === 'percentage') ? rubricMeta.weightBasis : 'percentage',
          },
          weights: {
            group: Number(rubricMeta?.groupWeight ?? 0) || 0,
            individual: Number(rubricMeta?.individualWeight ?? 0) || 0,
          },
          rubricMeta,
        },
        entity: (() => {
          const group = assessment.subjectType === 'GROUP'
            ? {
                groupId: assessment.subjectId,
                groupName: `Group ${assessment.subjectId}`,
                members: [],
              }
            : null;
          const individuals = assessment.subjectType === 'GROUP'
            ? []
            : [{
                studentId: assessment.subjectId,
                name: `Student ${assessment.subjectId}`,
              }];
          return {
            group,
            groupId: group?.groupId,
            groupName: group?.groupName,
            individuals,
          };
        })(),
        predefinedComments: {},
        existingAssessment: assessment.status !== 'unmarked' ? {
          // Use the real submissionId as assessmentId for downstream submit operations
          assessmentId: Number(assessment.submissionId),
          status: assessment.status?.toUpperCase() || 'DRAFT',
          submittedAt: assessment.submittedAt,
          totalScore: assessment.totalScore,
          overallFeedback: assessment.overallFeedback,
          adminNote: typeof assessment.adminNote === 'string' ? assessment.adminNote : '',
          // Convert scores back into separate entities using criteriaFromMeta
          entities: (() => {
            const byDesc = new Map(criteria.map((c) => [c.description, c]));

            const makeItem = (score) => {
              const criterion = byDesc.get(score.description);
              if (!criterion) return null;
              // resolve levelId
              let levelId = null;
              if (score.selectedLevel && Array.isArray(criterion.performanceLevel)) {
                const lvl = criterion.performanceLevel.find((l) => l.description === score.selectedLevel.description
                  || (typeof score.selectedLevel.description === 'string' && l.description === score.selectedLevel.description));
                levelId = lvl?.levelId || null;
              }
              if (!levelId && Array.isArray(criterion.performanceLevel) && (score.inputPoints ?? null) !== null) {
                const lvl = criterion.performanceLevel.find((l) => score.inputPoints >= l.startPoint && score.inputPoints <= l.endPoint);
                levelId = lvl?.levelId || null;
              }
              const points = Number(score.inputPoints || 0);
              return {
                criterionId: criterion.criterionId,
                levelId,
                points,
                comments: score.comment ? [{ text: score.comment }] : [],
              };
            };

            const groupItems = [];
            const individualItems = [];
            (scores || []).forEach((s) => {
              const criterion = byDesc.get(s.description);
              if (!criterion) return;
              const item = makeItem(s);
              if (!item) return;
              if (criterion.appliesTo === 'GROUP') groupItems.push(item);
              else individualItems.push(item);
            });

            const arr = [];
            if (groupItems.length) {
              arr.push({ kind: 'GROUP', items: groupItems, overallFeedback: assessment.overallFeedback || '', notes: assessment.adminNote || '' });
            }
            if (individualItems.length) {
              arr.push({ kind: 'INDIVIDUAL', studentId: assessment.subjectId, items: individualItems });
            }
            return arr;
          })()
        } : null
      };

      // Enrich with weight basis and bucket weights if available
      sessionContext.assignment.groupWeight = sessionContext.assignment.weights.group;
      sessionContext.assignment.individualWeight = sessionContext.assignment.weights.individual;

      console.log('DEBUG - Constructed criteria structure:', sessionContext.assignment.rubric.criteria);
      console.log('DEBUG - Constructed existingAssessment:', sessionContext.existingAssessment);
      
      return {
        success: true,
        code: 'OK',
        data: sessionContext
      };
    } catch (error) {
      console.error('Error fetching timeslot context:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch timeslot context',
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
      const groupInfo = sessionContext?.entity?.group || null;
      const individuals = Array.isArray(sessionContext?.entity?.individuals) ? sessionContext.entity.individuals : [];
      const normalizeId = (value) => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
          const match = value.match(/\d+/);
          return match ? Number(match[0]) : null;
        }
        return null;
      };
      const isGroup = Boolean(groupInfo);
      const subjectType = isGroup ? 'GROUP' : 'INDIVIDUAL';
      const subjectId = normalizeId(isGroup
        ? (groupInfo?.groupId ?? sessionContext?.entity?.groupId)
        : (individuals[0]?.studentId ?? sessionContext?.entity?.subjectId));
      if (subjectId == null) {
        return {
          success: false,
          code: 'ERROR',
          message: 'Missing subjectId for draft save'
        };
      }

      const rubricCriteria = sessionContext?.assignment?.rubric?.criteria || [];
      const entities = Array.isArray(assessmentData.entities) ? assessmentData.entities : [];
      const scores = buildUnifiedScores({
        entities,
        rubricCriteria,
        absentStudentIds: assessmentData?.absentStudents || [],
        individualsList: individuals,
      });

      // Build the request payload matching backend API format for Save Draft
      // Note: Save Draft does NOT include submissionId
      // Use sessionId from route parameters (passed as submissionId parameter) instead of API response
      const payload = {
        assignmentId: assessmentData.assignmentId || sessionContext?.assignment?.id || 0,
        sessionId: assessmentData.sessionId || sessionContext?.sessionId || 0,
        subjectId: Number(subjectId),
        overallFeedback: assessmentData.overallFeedback || '',
        scores,
      };

      const response = await apiClient.post(
        `/api/examiner/assessments/draft/save`,
        payload
      );

      // Ensure consistent response format（优先取后端返回的 submissionId，其次 assessmentId）
      if (response.data) {
        const top = response.data;
        const inner = top.data || {};
        const returnedSubmissionId = inner.submissionId ?? top.submissionId ?? inner.id ?? top.id;
        const returnedAssessmentId = inner.assessmentId ?? top.assessmentId;
        if (top.success) {
          return {
            success: true,
            code: 'OK',
            data: {
              submissionId: returnedSubmissionId,
              assessmentId: returnedAssessmentId,
              status: 'DRAFT'
            }
          };
        }
        // 非 success 也返回原始 payload，交由调用方处理
        return top;
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
      const groupInfo = sessionContext?.entity?.group || null;
      const individualsList = Array.isArray(sessionContext?.entity?.individuals) ? sessionContext.entity.individuals : [];
      const normalizeId = (value) => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
          const match = value.match(/\d+/);
          return match ? Number(match[0]) : null;
        }
        return null;
      };
      const isGroup = Boolean(groupInfo);
      const subjectType = isGroup ? 'GROUP' : 'INDIVIDUAL';
      const subjectId = normalizeId(isGroup
        ? (groupInfo?.groupId ?? sessionContext?.entity?.groupId)
        : (individualsList[0]?.studentId ?? sessionContext?.entity?.subjectId));
      if (subjectId == null) {
        return {
          success: false,
          code: 'ERROR',
          message: 'Missing subjectId for submit'
        };
      }

      const rubricCriteria = sessionContext?.assignment?.rubric?.criteria || [];
      const entities = Array.isArray(assessmentData.entities) ? assessmentData.entities : [];
      const scores = buildUnifiedScores({
        entities,
        rubricCriteria,
        absentStudentIds: assessmentData?.absentStudents || [],
        individualsList,
      });

      // Resolve submissionId strictly from assessmentData (no fallback)
      const effectiveSubmissionIdRaw = assessmentData?.assessmentId ?? assessmentData?.submissionId;
      const effectiveSubmissionId = Number(effectiveSubmissionIdRaw);

      // Build the request payload matching backend API format for Complete Assessment
      const payload = {
        ...(Number.isFinite(effectiveSubmissionId) ? { submissionId: effectiveSubmissionId } : {}),
        assignmentId: assessmentData.assignmentId || sessionContext?.assignment?.id || 0,
        sessionId: sessionContext?.sessionId || 0,
        subjectId: Number(subjectId),
        overallFeedback: assessmentData.overallFeedback || '',
        scores,
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
            submissionId: Number.isFinite(effectiveSubmissionId) ? effectiveSubmissionId : undefined,
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
