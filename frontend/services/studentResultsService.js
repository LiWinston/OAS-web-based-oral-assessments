// For development - mock API responses
const USE_MOCK_API = true;
import api from './apiClient';

// Mock service implementation - generates data for any student ID
const mockStudentResultsService = {
  // List student's assignments with results
  async getStudentResults(studentId, options = {}) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const {
      status = 'released',
      semester = 'all',
      pageNum = 0,
      pageSize = 20,
      sort = 'date_desc'
    } = options;
    
    // Generate mock data for any student ID
    const mockAssignments = [
      {
        assignmentId: 101,
        assignmentName: 'Network Security Project',
        courseCode: 'COMP30023',
        courseName: 'Computer Networks',
        semester: '2024 Semester 2',
        assessmentType: 'GROUP',
        result: {
          resultId: 5001,
          entity: { type: 'GROUP', groupId: 301, groupName: 'Team Alpha' },
          finalGrade: 'A',
          percentage: 92,
          totalPoints: 92,
          maxPoints: 100,
          resultStatus: 'released',
          assessedOn: '2024-10-15T14:30:00+11:00',
          releasedOn: '2024-10-20T09:00:00+11:00',
          aggregationMethod: 'average',
          examinerCount: 2
        },
        hasDetailedFeedback: true
      },
      {
        assignmentId: 102,
        assignmentName: 'Oral Presentation',
        courseCode: 'COMP90082',
        courseName: 'Software Project',
        semester: '2024 Semester 1',
        assessmentType: 'INDIVIDUAL',
        result: {
          resultId: 5002,
          entity: { type: 'INDIVIDUAL', studentId: studentId },
          finalGrade: 'B+',
          percentage: 78,
          totalPoints: 78,
          maxPoints: 100,
          resultStatus: 'released',
          assessedOn: '2024-05-20T10:00:00+10:00',
          releasedOn: '2024-05-25T16:00:00+10:00',
          aggregationMethod: 'average',
          examinerCount: 1
        },
        hasDetailedFeedback: true
      },
      {
        assignmentId: 103,
        assignmentName: 'Database Design Presentation',
        courseCode: 'COMP90024',
        courseName: 'Cluster and Cloud Computing',
        semester: '2024 Semester 1',
        assessmentType: 'MIXED',
        result: {
          resultId: 5003,
          entity: { type: 'GROUP', groupId: 302, groupName: 'Cloud Team' },
          finalGrade: 'A-',
          percentage: 85,
          totalPoints: 85,
          maxPoints: 100,
          resultStatus: 'released',
          assessedOn: '2024-04-10T15:00:00+10:00',
          releasedOn: '2024-04-15T12:00:00+10:00',
          aggregationMethod: 'average',
          examinerCount: 2
        },
        hasDetailedFeedback: true
      }
    ];
    
    let results = mockAssignments;
    
    // Filter by status
    if (status !== 'all') {
      results = results.filter(r => r.result.resultStatus === status);
    }
    
    // Filter by semester  
    if (semester !== 'all' && semester !== 'current') {
      results = results.filter(r => r.semester === semester);
    }
    
    // Sort results
    switch (sort) {
      case 'date_desc':
        results.sort((a, b) => new Date(b.result.assessedOn) - new Date(a.result.assessedOn));
        break;
      case 'date_asc':
        results.sort((a, b) => new Date(a.result.assessedOn) - new Date(b.result.assessedOn));
        break;
      case 'grade_desc':
        results.sort((a, b) => b.result.percentage - a.result.percentage);
        break;
      default:
        break;
    }
    
    // Pagination
    const start = pageNum * pageSize;
    const paginatedResults = results.slice(start, start + pageSize);
    
    return {
      success: true,
      code: 'OK',
      data: {
        pageNum,
        pageSize,
        total: results.length,
        data: paginatedResults,
        cachingHintSeconds: 3600
      }
    };
  },

  // Get assignment result summary
  async getAssignmentResult(studentId, assignmentId) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get the mock assignment data
    const resultsResponse = await this.getStudentResults(studentId, { pageSize: 100 });
    const assignments = resultsResponse.data.data;
    const assignment = assignments.find(r => r.assignmentId == assignmentId);
    
    if (!assignment) {
      throw new Error('Assignment result not found');
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
          semester: assignment.semester
        },
        result: assignment.result,
        summary: {
          criteriaCount: 3,
          highestCriterion: 'Technical Implementation',
          lowestCriterion: 'Documentation', 
          feedbackItemsCount: 5
        }
      }
    };
  },

  // Get detailed rubric breakdown
  async getRubricBreakdown(studentId, assignmentId) {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Mock rubric data based on assignment ID
    const rubricData = {
      101: {
        resultId: 5001,
        rubricBreakdown: {
          aggregationMethod: 'average',
          criteria: [
            {
              criterionId: 1,
              name: 'Technical Implementation',
              description: 'Quality of code and security protocols',
              weight: 50,
              maxPoints: 50,
              earnedPoints: 45,
              examinerScores: [
                { examinerId: 201, examinerName: 'Dr. Smith', points: 46, level: 'Very Good' },
                { examinerId: 202, examinerName: 'Prof. Johnson', points: 44, level: 'Good' }
              ],
              comments: [
                'Excellent implementation of security protocols with robust error handling.',
                'Code structure is well-organized and follows best practices.'
              ]
            },
            {
              criterionId: 2,
              name: 'Presentation',
              description: 'Clarity and technical communication',
              weight: 30,
              maxPoints: 30,
              earnedPoints: 28,
              examinerScores: [
                { examinerId: 201, examinerName: 'Dr. Smith', points: 29, level: 'Very Good' },
                { examinerId: 202, examinerName: 'Prof. Johnson', points: 27, level: 'Good' }
              ],
              comments: [
                'Clear presentation with good technical explanations of complex concepts.'
              ]
            },
            {
              criterionId: 3,
              name: 'Documentation',
              description: 'Quality of technical documentation',
              weight: 20,
              maxPoints: 20,
              earnedPoints: 19,
              examinerScores: [
                { examinerId: 201, examinerName: 'Dr. Smith', points: 20, level: 'Outstanding' },
                { examinerId: 202, examinerName: 'Prof. Johnson', points: 18, level: 'Good' }
              ],
              comments: [
                'Comprehensive documentation with clear API specifications.',
                'Could benefit from more detailed deployment instructions.'
              ]
            }
          ]
        }
      },
      102: {
        resultId: 5002,
        rubricBreakdown: {
          aggregationMethod: 'average',
          criteria: [
            {
              criterionId: 1,
              name: 'Content Knowledge',
              description: 'Understanding and accuracy of the subject matter',
              weight: 30,
              maxPoints: 30,
              earnedPoints: 24,
              examinerScores: [
                { examinerId: 203, examinerName: 'Dr. Wilson', points: 24, level: 'Good' }
              ],
              comments: [
                'Good understanding with some minor gaps in advanced concepts.'
              ]
            },
            {
              criterionId: 2,
              name: 'Presentation Delivery',
              description: 'Clarity, pace, and engagement of the presentation',
              weight: 40,
              maxPoints: 40,
              earnedPoints: 32,
              examinerScores: [
                { examinerId: 203, examinerName: 'Dr. Wilson', points: 32, level: 'Very Good' }
              ],
              comments: [
                'Clear delivery with good eye contact and audience engagement.',
                'Could improve pace in technical sections.'
              ]
            },
            {
              criterionId: 3,
              name: 'Visual Aids & Organization',
              description: 'Quality and effectiveness of visual materials',
              weight: 30,
              maxPoints: 30,
              earnedPoints: 22,
              examinerScores: [
                { examinerId: 203, examinerName: 'Dr. Wilson', points: 22, level: 'Good' }
              ],
              comments: [
                'Slides are clear but could be more visually engaging.',
                'Good organization of content flow.'
              ]
            }
          ]
        }
      },
      103: {
        resultId: 5003,
        rubricBreakdown: {
          aggregationMethod: 'average',
          criteria: [
            {
              criterionId: 1,
              name: 'Database Design',
              description: 'Quality of database schema and normalization',
              weight: 35,
              maxPoints: 35,
              earnedPoints: 30,
              examinerScores: [
                { examinerId: 204, examinerName: 'Prof. Chen', points: 31, level: 'Very Good' },
                { examinerId: 205, examinerName: 'Dr. Liu', points: 29, level: 'Good' }
              ],
              comments: [
                'Well-designed schema with proper normalization.',
                'Good use of indexes and constraints.'
              ]
            },
            {
              criterionId: 2,
              name: 'Cloud Implementation',
              description: 'Effectiveness of cloud deployment and scaling',
              weight: 35,
              maxPoints: 35,
              earnedPoints: 29,
              examinerScores: [
                { examinerId: 204, examinerName: 'Prof. Chen', points: 30, level: 'Very Good' },
                { examinerId: 205, examinerName: 'Dr. Liu', points: 28, level: 'Good' }
              ],
              comments: [
                'Good understanding of cloud principles.',
                'Auto-scaling implementation needs refinement.'
              ]
            },
            {
              criterionId: 3,
              name: 'Team Collaboration',
              description: 'Evidence of effective teamwork and coordination',
              weight: 30,
              maxPoints: 30,
              earnedPoints: 26,
              examinerScores: [
                { examinerId: 204, examinerName: 'Prof. Chen', points: 27, level: 'Good' },
                { examinerId: 205, examinerName: 'Dr. Liu', points: 25, level: 'Satisfactory' }
              ],
              comments: [
                'Clear division of responsibilities.',
                'Could improve coordination in final integration phase.'
              ]
            }
          ]
        }
      }
    };
    
    const rubricResult = rubricData[assignmentId];
    if (!rubricResult) {
      throw new Error('Rubric breakdown not found');
    }
    
    return {
      success: true,
      code: 'OK',
      data: rubricResult
    };
  },

  // Get rubric scale (levels per criterion) to render Canvas-style grid
  async getAssignmentRubricScale(studentId, assignmentId) {
    // For mock: derive 5 default levels (Outstanding → Needs Improvement)
    // using percentage bands over each criterion's maxPoints
    const defaultLevelsForMax = (max) => {
      const pct = (n) => Math.round((n / 100) * max);
      return [
        { id: 'lvl-outstanding', label: 'Outstanding', description: '90–100%', minPoints: pct(90), maxPoints: max },
        { id: 'lvl-very-good', label: 'Very Good', description: '80–89%', minPoints: pct(80), maxPoints: pct(89) },
        { id: 'lvl-good', label: 'Good', description: '70–79%', minPoints: pct(70), maxPoints: pct(79) },
        { id: 'lvl-satisfactory', label: 'Satisfactory', description: '60–69%', minPoints: pct(60), maxPoints: pct(69) },
        { id: 'lvl-needs-improvement', label: 'Needs Improvement', description: '0–59%', minPoints: 0, maxPoints: pct(59) },
      ];
    };

    // Reuse rubric breakdown to get criteria + maxPoints
    const rb = await this.getRubricBreakdown(studentId, assignmentId);
    const criteria = rb?.data?.rubricBreakdown?.criteria || [];
    return {
      success: true,
      code: 'OK',
      data: {
        criteria: criteria.map((c) => ({
          criterionId: c.criterionId,
          levels: defaultLevelsForMax(c.maxPoints || 100),
        })),
      },
    };
  },

  // Get examiner feedback
  async getExaminerFeedback(studentId, assignmentId) {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Mock feedback data based on assignment ID
    const feedbackData = {
      101: {
        resultId: 5001,
        examinerFeedback: [
          {
            examinerId: 201,
            examinerName: 'Dr. Smith',
            overallComment: 'Excellent work overall. Strong technical implementation with clear presentation.',
            criterionFeedback: [
              {
                criterionId: 1,
                criterionName: 'Technical Implementation',
                comment: 'Excellent implementation of security protocols with robust error handling.',
                strengths: ['Strong error handling', 'Clean code structure', 'Comprehensive testing'],
                improvements: []
              },
              {
                criterionId: 2,
                criterionName: 'Presentation',
                comment: 'Clear presentation with good technical explanations of complex concepts.',
                strengths: ['Clear communication', 'Good use of examples'],
                improvements: ['Could slow down in technical sections']
              }
            ],
            submittedOn: '2024-10-15T15:00:00+11:00'
          },
          {
            examinerId: 202,
            examinerName: 'Prof. Johnson',
            overallComment: 'Good project with solid technical foundation. Documentation needs improvement.',
            criterionFeedback: [
              {
                criterionId: 3,
                criterionName: 'Documentation',
                comment: 'Documentation could be more detailed, especially regarding the API endpoints.',
                strengths: ['Good overall structure'],
                improvements: ['More detailed API documentation', 'Complete all sections']
              }
            ],
            submittedOn: '2024-10-15T15:30:00+11:00'
          }
        ],
        consolidatedFeedback: {
          strengths: [
            'Excellent implementation of security protocols with robust error handling',
            'Clear presentation with good technical explanations',
            'Well-organized code structure'
          ],
          improvements: [
            'Documentation could be more detailed, especially regarding the API endpoints',
            'Could slow down in technical sections during presentation'
          ]
        }
      },
      102: {
        resultId: 5002,
        examinerFeedback: [
          {
            examinerId: 203,
            examinerName: 'Dr. Wilson',
            overallComment: 'Good presentation with clear delivery. Some areas for improvement in content depth.',
            criterionFeedback: [
              {
                criterionId: 1,
                criterionName: 'Content Knowledge',
                comment: 'Good understanding with some minor gaps in advanced concepts.',
                strengths: ['Solid foundation', 'Good examples'],
                improvements: ['Deeper understanding of advanced topics']
              },
              {
                criterionId: 2,
                criterionName: 'Presentation Delivery',
                comment: 'Clear delivery with good eye contact and audience engagement.',
                strengths: ['Excellent eye contact', 'Good audience engagement'],
                improvements: ['Improve pace in technical sections']
              }
            ],
            submittedOn: '2024-05-20T10:30:00+10:00'
          }
        ],
        consolidatedFeedback: {
          strengths: [
            'Clear delivery with excellent eye contact',
            'Good audience engagement',
            'Solid foundational knowledge'
          ],
          improvements: [
            'Develop deeper understanding of advanced topics',
            'Improve pace in technical sections'
          ]
        }
      },
      103: {
        resultId: 5003,
        examinerFeedback: [
          {
            examinerId: 204,
            examinerName: 'Prof. Chen',
            overallComment: 'Strong technical work with good cloud implementation. Team coordination could be improved.',
            criterionFeedback: [
              {
                criterionId: 1,
                criterionName: 'Database Design',
                comment: 'Well-designed schema with proper normalization.',
                strengths: ['Excellent normalization', 'Good use of constraints'],
                improvements: []
              },
              {
                criterionId: 2,
                criterionName: 'Cloud Implementation',
                comment: 'Good understanding of cloud principles.',
                strengths: ['Solid deployment strategy', 'Good monitoring setup'],
                improvements: ['Refine auto-scaling implementation']
              }
            ],
            submittedOn: '2024-04-10T15:30:00+10:00'
          },
          {
            examinerId: 205,
            examinerName: 'Dr. Liu',
            overallComment: 'Competent technical implementation. Team could improve final integration process.',
            criterionFeedback: [
              {
                criterionId: 3,
                criterionName: 'Team Collaboration',
                comment: 'Clear division of responsibilities.',
                strengths: ['Good individual contributions'],
                improvements: ['Better coordination in integration phase']
              }
            ],
            submittedOn: '2024-04-10T16:00:00+10:00'
          }
        ],
        consolidatedFeedback: {
          strengths: [
            'Excellent database normalization',
            'Solid cloud deployment strategy',
            'Clear division of team responsibilities'
          ],
          improvements: [
            'Refine auto-scaling implementation',
            'Better team coordination in integration phase'
          ]
        }
      }
    };
    
    const feedback = feedbackData[assignmentId];
    if (!feedback) {
      throw new Error('Examiner feedback not found');
    }
    
    return {
      success: true,
      code: 'OK',
      data: feedback
    };
  }
};

// Real API service implementation (for future backend integration)
const realStudentResultsService = {
  async getStudentResults(studentId, options = {}) {
    try {
      const {
        status = 'released',
        semester = 'all',
        pageNum = 0,
        pageSize = 20,
        sort = 'date_desc'
      } = options;
      
      const params = new URLSearchParams({
        status,
        semester,
        pageNum: pageNum.toString(),
        pageSize: pageSize.toString(),
        sort
      });
      
      const response = await api.get(`/api/students/${studentId}/results?${params}`);
      return response.data;
    } catch (err) {
      console.warn('[studentResultsService] getStudentResults failed; falling back to mock:', err?.message || err);
      return mockStudentResultsService.getStudentResults(studentId, options);
    }
  },

  async getAssignmentResult(studentId, assignmentId) {
    try {
      const response = await api.get(`/api/students/${studentId}/assignments/${assignmentId}/result`);
      return response.data;
    } catch (err) {
      console.warn('[studentResultsService] getAssignmentResult failed; falling back to mock:', err?.message || err);
      return mockStudentResultsService.getAssignmentResult(studentId, assignmentId);
    }
  },

  async getRubricBreakdown(studentId, assignmentId) {
    try {
      const response = await api.get(`/api/students/${studentId}/assignments/${assignmentId}/result/rubric`);
      return response.data;
    } catch (err) {
      console.warn('[studentResultsService] getRubricBreakdown failed; falling back to mock:', err?.message || err);
      return mockStudentResultsService.getRubricBreakdown(studentId, assignmentId);
    }
  },

  async getExaminerFeedback(studentId, assignmentId) {
    try {
      const response = await api.get(`/api/students/${studentId}/assignments/${assignmentId}/result/feedback`);
      return response.data;
    } catch (err) {
      console.warn('[studentResultsService] getExaminerFeedback failed; falling back to mock:', err?.message || err);
      return mockStudentResultsService.getExaminerFeedback(studentId, assignmentId);
    }
  },

  // Attempt to fetch rubric scale from backend; if unavailable, derive from rubric breakdown
  async getAssignmentRubricScale(studentId, assignmentId) {
    try {
      // If backend supports scale on rubric endpoint in future, prefer it.
      // Placeholder: call rubric breakdown then compute default levels by percentage bands.
      const rb = await this.getRubricBreakdown(studentId, assignmentId);
      const criteria = rb?.data?.rubricBreakdown?.criteria || [];
      const defaultLevelsForMax = (max) => {
        const pct = (n) => Math.round((n / 100) * (max || 100));
        return [
          { id: 'lvl-outstanding', label: 'Outstanding', description: '90–100%', minPoints: pct(90), maxPoints: max || 100 },
          { id: 'lvl-very-good', label: 'Very Good', description: '80–89%', minPoints: pct(80), maxPoints: pct(89) },
          { id: 'lvl-good', label: 'Good', description: '70–79%', minPoints: pct(70), maxPoints: pct(79) },
          { id: 'lvl-satisfactory', label: 'Satisfactory', description: '60–69%', minPoints: pct(60), maxPoints: pct(69) },
          { id: 'lvl-needs-improvement', label: 'Needs Improvement', description: '0–59%', minPoints: 0, maxPoints: pct(59) },
        ];
      };
      return {
        success: true,
        code: 'OK',
        data: {
          criteria: criteria.map((c) => ({
            criterionId: c.criterionId,
            levels: defaultLevelsForMax(c.maxPoints),
          })),
        },
      };
    } catch (e) {
      console.warn('[studentResultsService] getAssignmentRubricScale failed; falling back to mock:', e?.message || e);
      return mockStudentResultsService.getAssignmentRubricScale(studentId, assignmentId);
    }
  },
};

// Export the appropriate service based on configuration
export const studentResultsService = USE_MOCK_API ? mockStudentResultsService : realStudentResultsService;
