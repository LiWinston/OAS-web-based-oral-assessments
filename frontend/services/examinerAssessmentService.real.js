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
      // Split payload into group scores and per-student individualScores
      const rubricCriteria = sessionContext?.assignment?.rubric?.criteria || [];
      const isGroupCriterion = (criterionId) => {
        const c = rubricCriteria.find(rc => rc.criterionId === criterionId);
        const a = (c?.appliesTo || 'BOTH').toUpperCase();
        return a === 'GROUP' || a === 'BOTH';
      };
      const isIndividualCriterion = (criterionId) => {
        const c = rubricCriteria.find(rc => rc.criterionId === criterionId);
        const a = (c?.appliesTo || 'BOTH').toUpperCase();
        return a === 'INDIVIDUAL' || a === 'BOTH';
      };

      const absentSet = new Set(assessmentData?.absentStudents || []);

      const buildScoreEntry = (criterion, item) => {
        // Find selected level using levelId or points range
        const levels = Array.isArray(criterion?.performanceLevel) ? criterion.performanceLevel : [];
        let selectedLevel = null;
        if (item.levelId) {
          selectedLevel = levels.find(l => l.levelId === item.levelId) || levels.find(l => l.description === item.levelId) || null;
        }
        if (!selectedLevel && (item.points ?? null) !== null) {
          selectedLevel = levels.find(l => item.points >= l.startPoint && item.points <= l.endPoint) || null;
        }
        if (!selectedLevel && (item.points ?? null) !== null && levels.length) {
          // closest by midpoint
          selectedLevel = levels.reduce((best, l) => {
            const mid = (l.startPoint + l.endPoint) / 2;
            const d = Math.abs((item.points || 0) - mid);
            if (!best || d < best.d) return { l, d };
            return best;
          }, null)?.l || null;
        }
        return {
          description: criterion?.description || '',
          scaleType: criterion?.scaleType || 'points',
          weight: Number(criterion?.weight) || 0,
          comment: Array.isArray(item.comments) && item.comments.length > 0 ? (item.comments[0].text || '') : '',
          inputPoints: Number(item.points || 0),
          selectedLevel: selectedLevel ? {
            description: selectedLevel.description,
            startPoint: selectedLevel.startPoint,
            endPoint: selectedLevel.endPoint,
          } : null,
        };
      };

      const scores = []; // group bucket
      const individualScores = []; // per student

      const entities = Array.isArray(assessmentData.entities) ? assessmentData.entities : [];
      // Group entity → single scores list
      const groupEntity = entities.find(e => e.kind === 'GROUP');
      if (groupEntity?.items?.length) {
        groupEntity.items.forEach(item => {
          if (!isGroupCriterion(item.criterionId)) return;
          const criterion = rubricCriteria.find(c => c.criterionId === item.criterionId);
          scores.push(buildScoreEntry(criterion, item));
        });
      }

      // Individual entities → per student scores
      const individualEntities = entities.filter(e => e.kind === 'INDIVIDUAL');
      individualEntities.forEach(entity => {
        const stuId = entity.studentId;
        if (absentSet.has(stuId)) {
          // Absent student → upload zero for each individual criterion, select the lowest band
          const stuCriteria = rubricCriteria.filter(c => isIndividualCriterion(c.criterionId));
          individualScores.push({
            studentId: stuId,
            individualFeedback: 'ABSENT',
            scores: stuCriteria.map(c => {
              const levels = Array.isArray(c.performanceLevel) ? c.performanceLevel : [];
              const lowest = levels.reduce((best, l) => (best == null || (Number(l.startPoint) || 0) < (Number(best.startPoint) || 0)) ? l : best, null);
              return {
                description: c.description || '',
                scaleType: c.scaleType || 'points',
                weight: Number(c.weight) || 0,
                comment: '',
                inputPoints: 0,
                selectedLevel: lowest ? {
                  description: lowest.description,
                  startPoint: lowest.startPoint,
                  endPoint: lowest.endPoint,
                } : null,
              };
            })
          });
          return;
        }
        const items = Array.isArray(entity.items) ? entity.items : [];
        const converted = items
          .filter(item => isIndividualCriterion(item.criterionId))
          .map(item => {
            const criterion = rubricCriteria.find(c => c.criterionId === item.criterionId);
            return buildScoreEntry(criterion, item);
          });
        individualScores.push({ studentId: stuId, individualFeedback: '', scores: converted });
      });

      // Ensure all absent students are included even if no items entity exists
      const allIndividuals = individuals;
      const alreadyIncluded = new Set(individualScores.map(s => s.studentId));
      allIndividuals.forEach(stu => {
        if (absentSet.has(stu.studentId) && !alreadyIncluded.has(stu.studentId)) {
          const stuCriteria = rubricCriteria.filter(c => isIndividualCriterion(c.criterionId));
          individualScores.push({
            studentId: stu.studentId,
            individualFeedback: 'ABSENT',
        scores: stuCriteria.map(c => {
          const levels = Array.isArray(c.performanceLevel) ? c.performanceLevel : [];
          const lowest = levels.reduce((best, l) => (best == null || (Number(l.startPoint) || 0) < (Number(best.startPoint) || 0)) ? l : best, null);
          return {
            description: c.description || '',
            scaleType: c.scaleType || 'points',
            weight: Number(c.weight) || 0,
            comment: '',
            inputPoints: 0,
            selectedLevel: lowest ? {
              description: lowest.description,
              startPoint: lowest.startPoint,
              endPoint: lowest.endPoint,
            } : null,
          };
        })
          });
        }
      });

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
        scores,
        individualScores
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
      // Split payload into group scores and per-student individualScores
      const rubricCriteria = sessionContext?.assignment?.rubric?.criteria || [];
      const isGroupCriterion = (criterionId) => {
        const c = rubricCriteria.find(rc => rc.criterionId === criterionId);
        const a = (c?.appliesTo || 'BOTH').toUpperCase();
        return a === 'GROUP' || a === 'BOTH';
      };
      const isIndividualCriterion = (criterionId) => {
        const c = rubricCriteria.find(rc => rc.criterionId === criterionId);
        const a = (c?.appliesTo || 'BOTH').toUpperCase();
        return a === 'INDIVIDUAL' || a === 'BOTH';
      };

      const absentSet = new Set(assessmentData?.absentStudents || []);

      const buildScoreEntry = (criterion, item) => {
        const levels = Array.isArray(criterion?.performanceLevel) ? criterion.performanceLevel : [];
        let selectedLevel = null;
        if (item.levelId) {
          selectedLevel = levels.find(l => l.levelId === item.levelId) || levels.find(l => l.description === item.levelId) || null;
        }
        if (!selectedLevel && (item.points ?? null) !== null) {
          selectedLevel = levels.find(l => item.points >= l.startPoint && item.points <= l.endPoint) || null;
        }
        if (!selectedLevel && (item.points ?? null) !== null && levels.length) {
          selectedLevel = levels.reduce((best, l) => {
            const mid = (l.startPoint + l.endPoint) / 2;
            const d = Math.abs((item.points || 0) - mid);
            if (!best || d < best.d) return { l, d };
            return best;
          }, null)?.l || null;
        }
        return {
          description: criterion?.description || '',
          scaleType: criterion?.scaleType || 'points',
          weight: Number(criterion?.weight) || 0,
          comment: Array.isArray(item.comments) && item.comments.length > 0 ? (item.comments[0].text || '') : '',
          inputPoints: Number(item.points || 0),
          selectedLevel: selectedLevel ? {
            description: selectedLevel.description,
            startPoint: selectedLevel.startPoint,
            endPoint: selectedLevel.endPoint,
          } : null,
        };
      };

      const scores = [];
      const individualScores = [];

      const entities = Array.isArray(assessmentData.entities) ? assessmentData.entities : [];
      const groupEntity = entities.find(e => e.kind === 'GROUP');
      if (groupEntity?.items?.length) {
        groupEntity.items.forEach(item => {
          if (!isGroupCriterion(item.criterionId)) return;
          const criterion = rubricCriteria.find(c => c.criterionId === item.criterionId);
          scores.push(buildScoreEntry(criterion, item));
        });
      }

      const individualEntities = entities.filter(e => e.kind === 'INDIVIDUAL');
      individualEntities.forEach(entity => {
        const stuId = entity.studentId;
        if (absentSet.has(stuId)) {
          const stuCriteria = rubricCriteria.filter(c => isIndividualCriterion(c.criterionId));
          individualScores.push({
            studentId: stuId,
            individualFeedback: 'ABSENT',
            scores: stuCriteria.map(c => ({
              description: c.description || '',
              scaleType: c.scaleType || 'points',
              weight: Number(c.weight) || 0,
              comment: '',
              inputPoints: 0,
              selectedLevel: null,
            }))
          });
          return;
        }
        const items = Array.isArray(entity.items) ? entity.items : [];
        const converted = items
          .filter(item => isIndividualCriterion(item.criterionId))
          .map(item => {
            const criterion = rubricCriteria.find(c => c.criterionId === item.criterionId);
            return buildScoreEntry(criterion, item);
          });
        individualScores.push({ studentId: stuId, individualFeedback: '', scores: converted });
      });

      // Ensure all absent students are included even if no items entity exists
      const alreadyIncluded2 = new Set(individualScores.map(s => s.studentId));
      individualsList.forEach(stu => {
        if (absentSet.has(stu.studentId) && !alreadyIncluded2.has(stu.studentId)) {
          const stuCriteria = rubricCriteria.filter(c => isIndividualCriterion(c.criterionId));
          individualScores.push({
            studentId: stu.studentId,
            individualFeedback: 'ABSENT',
            scores: stuCriteria.map(c => {
              const levels = Array.isArray(c.performanceLevel) ? c.performanceLevel : [];
              const lowest = levels.reduce((best, l) => (best == null || (Number(l.startPoint) || 0) < (Number(best.startPoint) || 0)) ? l : best, null);
              return {
                description: c.description || '',
                scaleType: c.scaleType || 'points',
                weight: Number(c.weight) || 0,
                comment: '',
                inputPoints: 0,
                selectedLevel: lowest ? {
                  description: lowest.description,
                  startPoint: lowest.startPoint,
                  endPoint: lowest.endPoint,
                } : null,
              };
            })
          });
        }
      });

      // Resolve submissionId strictly from assessmentData (no fallback)
      const effectiveSubmissionIdRaw = assessmentData?.assessmentId ?? assessmentData?.submissionId;
      const effectiveSubmissionId = Number(effectiveSubmissionIdRaw);
      if (!Number.isFinite(effectiveSubmissionId)) {
        return {
          success: false,
          code: 'ERROR',
          message: 'Missing submissionId for submit'
        };
      }

      // Build the request payload matching backend API format for Complete Assessment
      const payload = {
        submissionId: effectiveSubmissionId,
        assignmentId: assessmentData.assignmentId || sessionContext?.assignment?.id || 0,
        sessionId: sessionContext?.sessionId || 0,
        subjectType: subjectType,
        subjectId: Number(subjectId),
        overallFeedback: assessmentData.overallFeedback || '',
        adminNote: assessmentData.privateNotes || '', // Backend expects adminNote, not privateNote
        scores,
        individualScores
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
            submissionId: effectiveSubmissionId,
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
