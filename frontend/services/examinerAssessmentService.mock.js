/**
 * Mock Data for Examiner Assessment Service
 * Contains all mock data for testing examiner assessment functionality
 */

export const mockMarkingSessionsMixed = {
  assignment: { id: 101, name: "Final Project Defense (Mixed)", type: "mixed" },
  sessions: [
    {
      sessionId: 90011,
      slotId: 5001,
      start: "2025-04-14T10:00:00+10:00",
      end: "2025-04-14T10:30:00+10:00",
      timezone: "Australia/Melbourne",
      entity: { kind: "GROUP", groupId: 501, members: 4 },
      status: "unmarked",
      coExaminers: [{ examinerId: 44, name: "Dr. Sarah Mitchell" }]
    }
  ]
};

export const mockMarkingSessionsIndividual = {
  assignment: { id: 102, name: "Midterm Oral (Individual)", type: "individual" },
  sessions: [
    {
      sessionId: 90012,
      slotId: 5002,
      start: "2025-04-14T10:30:00+10:00",
      end: "2025-04-14T11:00:00+10:00",
      timezone: "Australia/Melbourne",
      entity: { kind: "INDIVIDUAL", studentId: 201, name: "Alex Chen" },
      status: "draft",
      coExaminers: [{ examinerId: 44, name: "Dr. Sarah Mitchell" }]
    }
  ]
};

export const mockMarkingSessionsGroup = {
  assignment: { id: 103, name: "Capstone Presentation (Group)", type: "group" },
  sessions: [
    {
      sessionId: 90013,
      slotId: 5003,
      start: "2025-04-14T11:00:00+10:00",
      end: "2025-04-14T11:30:00+10:00",
      timezone: "Australia/Melbourne",
      entity: { kind: "GROUP", groupId: 701, members: 3 },
      status: "submitted",
      coExaminers: [{ examinerId: 45, name: "Prof. James Wilson" }]
    }
  ]
};

export const mockSessionContext = {
  assignment: {
    id: 101,
    name: "Final Project Defense",
    type: "mixed",
    groupWeight: 0.6,
    individualWeight: 0.4,
    rubricMeta: { 
      name: "Software Project Oral Assessment", 
      description: "Comprehensive assessment for final project presentation",
      totalPoints: 100 
    },
    rubric: {
      criteria: [
        {
          criterionId: "C1",
          description: "Content & Structure",
          weight: 25,
          markingScale: "descriptive",
          appliesTo: "GROUP",
          levels: [
            { levelId: "L1", description: "Poor - Incomplete, disorganized", minPoints: 0, maxPoints: 49 },
            { levelId: "L2", description: "Fair - Basic coverage, weak structure", minPoints: 50, maxPoints: 59 },
            { levelId: "L3", description: "Good - Solid content, clear structure", minPoints: 60, maxPoints: 74 },
            { levelId: "L4", description: "Very Good - Comprehensive, well-structured", minPoints: 75, maxPoints: 89 },
            { levelId: "L5", description: "Excellent - Exceptional, perfectly structured", minPoints: 90, maxPoints: 100 }
          ]
        },
        {
          criterionId: "C2",
          description: "Clarity & Communication",
          weight: 25,
          markingScale: "descriptive",
          appliesTo: "GROUP",
          levels: [
            { levelId: "L1", description: "Poor - Unclear, difficult to follow", minPoints: 0, maxPoints: 49 },
            { levelId: "L2", description: "Fair - Sometimes clear, inconsistent", minPoints: 50, maxPoints: 59 },
            { levelId: "L3", description: "Good - Mostly clear, effective communication", minPoints: 60, maxPoints: 74 },
            { levelId: "L4", description: "Very Good - Clear, highly effective", minPoints: 75, maxPoints: 89 },
            { levelId: "L5", description: "Excellent - Exceptionally clear, engaging", minPoints: 90, maxPoints: 100 }
          ]
        },
        {
          criterionId: "C3",
          description: "Technical Demonstration",
          weight: 30,
          markingScale: "descriptive",
          appliesTo: "GROUP",
          levels: [
            { levelId: "L1", description: "Poor - Failed or severely limited demo", minPoints: 0, maxPoints: 49 },
            { levelId: "L2", description: "Fair - Basic demo with significant issues", minPoints: 50, maxPoints: 59 },
            { levelId: "L3", description: "Good - Effective demo with minor issues", minPoints: 60, maxPoints: 74 },
            { levelId: "L4", description: "Very Good - Smooth demo, no significant issues", minPoints: 75, maxPoints: 89 },
            { levelId: "L5", description: "Excellent - Flawless, impressive demonstration", minPoints: 90, maxPoints: 100 }
          ]
        },
        {
          criterionId: "C4",
          description: "Individual Contribution",
          weight: 20,
          markingScale: "descriptive",
          appliesTo: "INDIVIDUAL",
          levels: [
            { levelId: "L1", description: "Poor - Minimal contribution", minPoints: 0, maxPoints: 49 },
            { levelId: "L2", description: "Fair - Limited contribution", minPoints: 50, maxPoints: 59 },
            { levelId: "L3", description: "Good - Adequate contribution", minPoints: 60, maxPoints: 74 },
            { levelId: "L4", description: "Very Good - Strong contribution", minPoints: 75, maxPoints: 89 },
            { levelId: "L5", description: "Excellent - Outstanding contribution", minPoints: 90, maxPoints: 100 }
          ]
        }
      ]
    }
  },
  session: {
    sessionId: 90011,
    slotId: 5001,
    start: "2025-04-14T10:00:00+10:00",
    end: "2025-04-14T10:30:00+10:00",
    timezone: "Australia/Melbourne",
    venue: { venueId: 1, name: "Engineering Building", building: "Building 405", room: "Room 405" },
    coExaminers: [{ examinerId: 44, name: "Dr. Sarah Mitchell" }]
  },
  entity: {
    kind: "GROUP",
    group: {
      groupId: 501,
      groupName: "Team Innovate",
      members: [
        { studentId: 201, name: "Alex Chen", email: "alex.chen@student.unimelb.edu.au" },
        { studentId: 202, name: "Maria Rodriguez", email: "maria.rodriguez@student.unimelb.edu.au" },
        { studentId: 203, name: "David Kim", email: "david.kim@student.unimelb.edu.au" },
        { studentId: 204, name: "Sarah Johnson", email: "sarah.johnson@student.unimelb.edu.au" }
      ]
    },
    individuals: [
      { studentId: 201, name: "Alex Chen", email: "alex.chen@student.unimelb.edu.au" },
      { studentId: 202, name: "Maria Rodriguez", email: "maria.rodriguez@student.unimelb.edu.au" },
      { studentId: 203, name: "David Kim", email: "david.kim@student.unimelb.edu.au" },
      { studentId: 204, name: "Sarah Johnson", email: "sarah.johnson@student.unimelb.edu.au" }
    ]
  },
  predefinedComments: {
    "C1": {
      "L1": [
        { id: "P1", text: "Content is severely lacking and disorganized", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P2", text: "Major content gaps with no logical flow", createdBy: 9, createdAt: "2025-04-10T12:05:00Z" }
      ],
      "L2": [
        { id: "P3", text: "Basic content coverage but lacks depth", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P4", text: "Presentation structure needs significant improvement", createdBy: 9, createdAt: "2025-04-10T12:05:00Z" }
      ],
      "L3": [
        { id: "P5", text: "Well-structured presentation with good content coverage", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P6", text: "The presentation follows a logical order with appropriate transitions", createdBy: 9, createdAt: "2025-04-10T12:05:00Z" },
        { id: "P7", text: "Good balance between technical details and high-level concepts", createdBy: 33, createdAt: "2025-04-11T14:00:00Z" }
      ],
      "L4": [
        { id: "P8", text: "Very well organized with comprehensive content", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P9", text: "Excellent content depth with strong supporting details", createdBy: 33, createdAt: "2025-04-11T14:00:00Z" }
      ],
      "L5": [
        { id: "P10", text: "Exceptionally well-structured with outstanding depth", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P11", text: "Perfect organization with comprehensive and insightful content", createdBy: 9, createdAt: "2025-04-10T12:05:00Z" }
      ]
    },
    "C2": {
      "L3": [
        { id: "P12", text: "Clear explanations of technical concepts", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P13", text: "Good use of examples to illustrate key points", createdBy: 9, createdAt: "2025-04-10T12:05:00Z" }
      ]
    },
    "C3": {
      "L4": [
        { id: "P14", text: "Demonstration showcased all key functionality effectively", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P15", text: "Very smooth demo flow with only minor hiccups", createdBy: 9, createdAt: "2025-04-10T12:05:00Z" }
      ]
    },
    "C4": {
      "L3": [
        { id: "P16", text: "Demonstrated adequate understanding of their contribution", createdBy: 9, createdAt: "2025-04-10T12:00:00Z" },
        { id: "P17", text: "Participated effectively in the presentation", createdBy: 33, createdAt: "2025-04-11T14:00:00Z" }
      ]
    }
  },
  existingAssessment: null
};

export const mockDraftAssessment = {
  assessmentId: "A-901",
  assignmentId: 101,
  sessionId: 90011,
  examinerId: 33,
  status: "DRAFT",
  revision: 1,
  entities: [
    {
      kind: "GROUP",
      groupId: 501,
      overallFeedback: "The presentation has a good overall structure with logical flow between sections.",
      notes: "Team seemed nervous at the beginning but gained confidence. Technical demo was well-prepared.",
      items: [
        { 
          criterionId: "C1", 
          levelId: "L3", 
          points: 70,
          comments: [
            { source: "predefined", text: "Well-structured presentation with good content coverage", predefinedId: "P5" }
          ]
        },
        { 
          criterionId: "C2", 
          levelId: "L3", 
          points: 65,
          comments: [
            { source: "predefined", text: "Clear explanations of technical concepts", predefinedId: "P12" },
            { source: "custom", text: "Could improve eye contact with audience" }
          ]
        },
        { 
          criterionId: "C3", 
          levelId: "L4", 
          points: 85,
          comments: [
            { source: "predefined", text: "Demonstration showcased all key functionality effectively", predefinedId: "P14" }
          ]
        }
      ],
      computed: {
        rawPoints: 73.75,
        weightedScore: 44.25
      }
    },
    {
      kind: "INDIVIDUAL",
      studentId: 201,
      items: [
        { 
          criterionId: "C4", 
          levelId: "L4", 
          points: 80,
          comments: [
            { source: "custom", text: "Strong leadership and technical knowledge demonstrated" }
          ]
        }
      ],
      computed: {
        rawPoints: 80,
        weightedScore: 16
      }
    },
    {
      kind: "INDIVIDUAL",
      studentId: 202,
      items: [
        { 
          criterionId: "C4", 
          levelId: "L3", 
          points: 70,
          comments: [
            { source: "predefined", text: "Participated effectively in the presentation", predefinedId: "P17" }
          ]
        }
      ],
      computed: {
        rawPoints: 70,
        weightedScore: 14
      }
    },
    {
      kind: "INDIVIDUAL",
      studentId: 203,
      items: [
        { 
          criterionId: "C4", 
          levelId: "L3", 
          points: 72,
          comments: [
            { source: "custom", text: "Good technical contributions during Q&A" }
          ]
        }
      ],
      computed: {
        rawPoints: 72,
        weightedScore: 14.4
      }
    },
    {
      kind: "INDIVIDUAL",
      studentId: 204,
      items: [
        { 
          criterionId: "C4", 
          levelId: "L3", 
          points: 68,
          comments: [
            { source: "predefined", text: "Demonstrated adequate understanding of their contribution", predefinedId: "P16" }
          ]
        }
      ],
      computed: {
        rawPoints: 68,
        weightedScore: 13.6
      }
    }
  ],
  totals: {
    perStudent: [
      { studentId: 201, finalScore: 60.25 }, // 44.25 (group * 0.6) + 16 (individual * 0.4)
      { studentId: 202, finalScore: 58.25 },
      { studentId: 203, finalScore: 58.65 },
      { studentId: 204, finalScore: 57.85 }
    ],
    groupScore: 73.75
  },
  updatedAt: "2025-04-14T10:22:00+10:00"
};

/**
 * Build individual-only context from base mock
 */
export function buildIndividualContext() {
  const base = JSON.parse(JSON.stringify(mockSessionContext));
  base.assignment.id = 102;
  base.assignment.name = "Midterm Oral (Individual)";
  base.assignment.type = "individual";
  delete base.assignment.groupWeight;
  delete base.assignment.individualWeight;
  base.session.sessionId = 90012;
  base.session.slotId = 5002;
  base.entity.kind = "INDIVIDUAL";
  delete base.entity.group;
  return base;
}

/**
 * Build group-only context from base mock
 */
export function buildGroupContext() {
  const base = JSON.parse(JSON.stringify(mockSessionContext));
  base.assignment.id = 103;
  base.assignment.name = "Capstone Presentation (Group)";
  base.assignment.type = "group";
  delete base.assignment.groupWeight;
  delete base.assignment.individualWeight;
  base.session.sessionId = 90013;
  base.session.slotId = 5003;
  base.entity.kind = "GROUP";
  delete base.entity.individuals;
  return base;
}