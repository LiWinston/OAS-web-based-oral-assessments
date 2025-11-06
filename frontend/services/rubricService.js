import api from "./apiClient";

const normalizeCriterionTypeForPayload = (value) => {
  const normalized = (value || "").toString().trim().toUpperCase();
  if (normalized === "GROUP") return "GROUP";
  return "INDIVIDUAL";
};

const transformLevelForPayload = (level = {}, criterionId, index) => {
  const description =
    (level.description || level.name || `Level ${index + 1}`).toString();
  const startPoint = Number(
    level.minPoints ?? level.startPoint ?? level.points ?? 0
  );
  const endPoint = Number(
    level.maxPoints ?? level.endPoint ?? level.points ?? startPoint
  );
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
      .map((comment) => (typeof comment === "string" ? comment : comment?.text))
      .filter(Boolean),
  };
};

const transformCriterionForPayload = (criterion = {}) => {
  const levels = Array.isArray(criterion.levels)
    ? criterion.levels.map((level, index) =>
        transformLevelForPayload(
          level,
          criterion.criterionId || criterion.id,
          index
        )
      )
    : [];

  const title = (criterion.title || "").toString();
  const description = title || (criterion.description || "").toString();

  return {
    criterionId: criterion.criterionId || criterion.id,
    title,
    description,
    weight: Number(criterion.weight) || 0,
    scaleType: "points",
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
    const typeKey = normalizeCriterionTypeForPayload(
      criterion.criterionType || criterion.component
    );
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
  const weightBasis = rubricData.weightBasis || "percentage";
  const totalPointsRaw = Number(rubricData.totalPoints);
  const totalPoints = Number.isFinite(totalPointsRaw)
    ? totalPointsRaw
    : weightBasis === "percentage"
    ? 100
    : 0;

  const individualWeightValue = Number(rubricData.individualWeight);
  const groupWeightValue = Number(rubricData.groupWeight);
  const individualWeight = Number.isFinite(individualWeightValue)
    ? individualWeightValue
    : 0;
  const groupWeight = Number.isFinite(groupWeightValue)
    ? groupWeightValue
    : 0;

  return {
    id: assignmentId,
    subjectId,
    name: rubricData.assignmentName || rubricData.name,
    description: rubricData.assignmentDescription || "Assignment description",
    type: rubricData.assignmentType || "individual",
    startDate: rubricData.startDate || new Date().toISOString(),
    endDate: rubricData.endDate || new Date().toISOString(),
    weight: rubricData.weight || 25,
    progress: rubricData.progress || 0,
    status: rubricData.status || "PENDING",
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

const rubricService = {
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
    const response = await api.put(
      `/api/assignments/${rubricData.assignmentId}`,
      requestData
    );
    return response.data;
  },

  async updateRubric(rubricId, updates) {
    const requestData = buildAssignmentRequestPayload(updates);
    const response = await api.put(
      `/api/assignments/${updates.assignmentId}`,
      requestData
    );
    return response.data;
  },

  async deleteRubric(rubricId) {
    const response = await api.delete(`/api/assignments/rubric/${rubricId}`);
    return response.data;
  },

  async duplicateRubric(rubricId, newAssignmentId) {
    const response = await api.post(
      `/api/assignments/rubric/${rubricId}/duplicate`,
      {
        assignmentId: newAssignmentId,
      }
    );
    return response.data;
  },

  async validateRubric(rubricData) {
    const errors = [];

    if (!rubricData.name || rubricData.name.trim().length === 0) {
      errors.push("Rubric name is required");
    }

    if (!rubricData.criteria || rubricData.criteria.length === 0) {
      errors.push("At least one criterion is required");
    }

    const basis = rubricData.weightBasis || "percentage";
    const expected =
      basis === "percentage" ? 100 : rubricData.totalPoints || 0;
    const total = rubricData.criteria.reduce(
      (sum, criterion) => sum + (criterion.weight || 0),
      0
    );
    if (total !== expected) {
      errors.push(
        `Total ${
          basis === "percentage" ? "weight" : "points"
        } must equal ${expected} (current: ${total})`
      );
    }

    rubricData.criteria.forEach((criterion, index) => {
      if (!criterion.title || criterion.title.trim().length === 0) {
        errors.push(`Criterion ${index + 1} must have a title`);
      }
      const criterionTypeValue = (criterion.criterionType ||
        criterion.component ||
        ""
      ).toUpperCase();
      if (!["INDIVIDUAL", "GROUP"].includes(criterionTypeValue)) {
        errors.push(
          `Criterion ${criterion.title || index + 1} must have a criterion type (Individual or Group)`
        );
      }

      if (!Array.isArray(criterion.levels) || criterion.levels.length === 0) {
        errors.push(
          `Criterion "${criterion.title}" must have at least one performance level`
        );
      }

      (criterion.levels || []).forEach((level) => {
        if (
          level.minPoints != null &&
          level.maxPoints != null &&
          level.minPoints > level.maxPoints
        ) {
          errors.push(
            `Invalid point range for level "${level.name || level.description}" in criterion "${criterion.title}"`
          );
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

export { rubricService };
export default rubricService;
