"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Save,
  Sparkles,
  Award,
  Target,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  User,
} from "lucide-react";
import { useNotification } from "@/hooks/useNotification";
import RubricCriterion from "@/components/admin/rubric/RubricCriterion";
import RubricPreview from "@/components/admin/rubric/RubricPreview";
import { rubricService } from "@/services/rubricService";
import { assignmentService } from "@/services/assignmentService";
import { courseService } from "@/services/courseService";

const CRITERION_TYPE_LABELS = {
  INDIVIDUAL: "Individual",
  GROUP: "Group",
};

const CRITERION_TYPE_OPTIONS = ["INDIVIDUAL", "GROUP"];

const normalizeAssignmentType = (type) => {
  const value = (type || "").toString().trim().toUpperCase();
  if (value === "GROUP" || value === "INDIVIDUAL" || value === "MIXED") {
    return value;
  }
  return "INDIVIDUAL";
};

const recommendCriterionTypeForAssignment = (assignmentType) => {
  const normalized = normalizeAssignmentType(assignmentType);
  if (normalized === "INDIVIDUAL" || normalized === "GROUP") {
    return normalized;
  }
  return null;
};

const coerceCriterionType = (criterionType, assignmentType) => {
  const normalized = (criterionType || "").toString().trim().toUpperCase();
  if (CRITERION_TYPE_OPTIONS.includes(normalized)) {
    return { value: normalized, coerced: false };
  }
  const fallback = recommendCriterionTypeForAssignment(assignmentType) || "INDIVIDUAL";
  return { value: fallback, coerced: true };
};

const generateCriterionId = () => {
  return `crit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

export default function RubricConfigurationPage() {
  const params = useParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [showWelcome, setShowWelcome] = useState(true);

  // Data states
  const [course, setCourse] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [rubric, setRubric] = useState({
    id: null,
    name: "",
    description: "",
    totalPoints: 100,
    weightBasis: "percentage", // 'percentage' | 'points'
    individualWeight: 100,
    groupWeight: 0,
    criteria: [],
  });
  const [requiresCriterionTypeReview, setRequiresCriterionTypeReview] = useState(false);
  const [criterionTypeReviewDismissed, setCriterionTypeReviewDismissed] = useState(false);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch course and assignment details
      // Using getAssignments list API to ensure consistent data structure
      const [courseResponse, assignmentsResponse] = await Promise.all([
        courseService.getCourse(params.courseId),
        assignmentService.getAssignments(params.courseId),
      ]);

      // Handle course response
      if (!courseResponse.success) {
        throw new Error("Course not found");
      }

      setCourse(courseResponse.data);

      // Handle assignments response - find the specific assignment
      let assignmentsData = assignmentsResponse;
      if (assignmentsResponse.success !== undefined) {
        assignmentsData = assignmentsResponse.data;
      }

      if (!Array.isArray(assignmentsData)) {
        throw new Error("Invalid assignments data format");
      }

      const assignmentData = assignmentsData.find(
        (item) => String(item?.id) === String(params.assignmentId)
      );

      if (!assignmentData) {
        throw new Error("Assignment not found");
      }

      // Map backend field names to frontend expected names
      const mappedAssignment = {
        id: assignmentData.id,
        name: assignmentData.name || "",
        title: assignmentData.name || "",
        description: assignmentData.description || "",
        type: assignmentData.type || "",
        dueDate: assignmentData.endDate || assignmentData.dueDate || null,
        startDate: assignmentData.startDate || null,
        weight: assignmentData.weight ?? null,
        status: assignmentData.status || "",
        rubricId: assignmentData.rubricId,
      };

      setAssignment(mappedAssignment);

      // Check if assignment has rubric data
      // Handle both rubricInfo and rubricsInfo (backend inconsistency)
      const rubricInfoArray = assignmentData.rubricInfo || assignmentData.rubricsInfo;
      let rubricMetaInfo = assignmentData.rubricMetaInfo;
      
      // Parse rubricMetaInfo if it's a string
      if (typeof rubricMetaInfo === 'string') {
        try {
          rubricMetaInfo = JSON.parse(rubricMetaInfo);
        } catch (e) {
          console.warn('Failed to parse rubricMetaInfo:', e);
          rubricMetaInfo = null;
        }
      }
      
      const assignmentType = normalizeAssignmentType(mappedAssignment.type);
      const ensureArray = (value) => (Array.isArray(value) ? value : []);

      const buildLevels = (rawLevels = [], resolvedCriterionId) => {
        if (!Array.isArray(rawLevels)) return [];
        return rawLevels.map((level, levelIndex) => {
          const min = Number(level?.minPoints ?? level?.startPoint ?? level?.points ?? 0);
          const max = Number(level?.maxPoints ?? level?.endPoint ?? level?.points ?? min ?? 0);
          const description = (level?.description || level?.name || `Level ${levelIndex + 1}`).toString();
          const commentsArray = Array.isArray(level?.comments)
            ? level.comments
            : Array.isArray(level?.preDefinedComment)
              ? level.preDefinedComment
              : [];

          return {
            id: level?.id || `${resolvedCriterionId}-level-${levelIndex}`,
            description,
            minPoints: Number.isFinite(min) ? min : 0,
            maxPoints: Number.isFinite(max) ? max : 0,
            color: level?.color || "blue",
            comments: commentsArray.map((comment, commentIndex) => ({
              id: `${resolvedCriterionId}-lvl-${levelIndex}-comment-${commentIndex}`,
              text: (typeof comment === "string" ? comment : comment?.text || "").toString(),
            })).filter((item) => item.text.length > 0),
          };
        });
      };

      const buildCriterionFromBackend = (criterion, typeKey, index) => {
        const resolvedCriterionId = (criterion?.criterionId || criterion?.id || generateCriterionId()).toString();
        const titleFallback = (criterion?.title || criterion?.name || criterion?.description || `Criterion ${index + 1}`).toString();
        const weight = Number(criterion?.weight) || 0;
        const scale = criterion?.scaleType || "points";
        const levels = buildLevels(criterion?.performanceLevel || criterion?.levels, resolvedCriterionId);

        return {
          id: resolvedCriterionId,
          criterionId: resolvedCriterionId,
          title: titleFallback,
          description: titleFallback,
          criterionType: typeKey,
          weight,
          markingScale: scale,
          levels,
          comments: Array.isArray(criterion?.comments)
            ? criterion.comments.map((comment, commentIndex) => ({
                id: `${resolvedCriterionId}-criterion-comment-${commentIndex}`,
                text: (typeof comment === "string" ? comment : comment?.text || "").toString(),
              })).filter((item) => item.text.length > 0)
            : [],
        };
      };

      let convertedCriteria = [];
      let criterionTypeCoercions = 0;
      let usedSplitRubrics = false;
      let individualWeight = Number(rubricMetaInfo?.individualWeight ?? NaN);
      let groupWeight = Number(rubricMetaInfo?.groupWeight ?? NaN);

      if (rubricMetaInfo) {
        const individualRubrics = ensureArray(rubricMetaInfo?.individualRubrics);
        const groupRubrics = ensureArray(rubricMetaInfo?.groupRubrics);

        if (individualRubrics.length || groupRubrics.length) {
          usedSplitRubrics = true;

          individualRubrics.forEach((criterion, index) => {
            convertedCriteria.push(buildCriterionFromBackend(criterion, "INDIVIDUAL", index));
          });

          groupRubrics.forEach((criterion, index) => {
            convertedCriteria.push(buildCriterionFromBackend(criterion, "GROUP", index));
          });
        }
      }

      if (!usedSplitRubrics && rubricMetaInfo && rubricInfoArray && Array.isArray(rubricInfoArray)) {
        convertedCriteria = rubricInfoArray.map((criterion, index) => {
          const rawTitle = (criterion.title || "").toString().trim();
          const fallbackTitle = rawTitle || (criterion.description ? criterion.description : `Criterion ${index + 1}`);
          const { value: criterionTypeValue, coerced } = coerceCriterionType(criterion.component, assignmentType);
          if (coerced) {
            criterionTypeCoercions += 1;
          }

          const resolvedCriterionId = (criterion.criterionId || generateCriterionId()).toString();
          const resolvedTitle = fallbackTitle.toString();

          return {
            id: resolvedCriterionId,
            criterionId: resolvedCriterionId,
            title: resolvedTitle,
            description: resolvedTitle,
            criterionType: criterionTypeValue,
            weight: Number(criterion.weight) || 0,
            markingScale: criterion.scaleType || "descriptive",
            levels: criterion.performanceLevel && Array.isArray(criterion.performanceLevel)
              ? buildLevels(criterion.performanceLevel, resolvedCriterionId)
              : [],
            comments: Array.isArray(criterion.comments)
              ? criterion.comments.map((comment, commentIndex) => ({
                  id: `${resolvedCriterionId}-criterion-comment-${commentIndex}`,
                  text: comment
                }))
              : [],
          };
        });

        if (!Number.isFinite(individualWeight) || !Number.isFinite(groupWeight)) {
          const totals = convertedCriteria.reduce((acc, criterion) => {
            const key = (criterion.criterionType || "INDIVIDUAL").toUpperCase();
            acc[key] = (acc[key] || 0) + (Number(criterion.weight) || 0);
            return acc;
          }, { INDIVIDUAL: 0, GROUP: 0 });
          individualWeight = totals.INDIVIDUAL ?? 0;
          groupWeight = totals.GROUP ?? 0;
        }
      }

      if (convertedCriteria.length) {
        const totalPoints = Number(rubricMetaInfo?.totalPoints) || rubric.totalPoints;
        const resolvedWeightBasis = rubricMetaInfo?.weightBasis || rubric.weightBasis;

        // If weights are still NaN, fall back to defaults based on assignment type
        if (!Number.isFinite(individualWeight)) {
          if (assignmentType === "GROUP") {
            individualWeight = 0;
          } else if (assignmentType === "MIXED") {
            const defaultTotal = resolvedWeightBasis === "points" ? totalPoints : 100;
            individualWeight = defaultTotal / 2;
          } else {
            individualWeight = resolvedWeightBasis === "points" ? totalPoints : 100;
          }
        }
        if (!Number.isFinite(groupWeight)) {
          if (assignmentType === "INDIVIDUAL") {
            groupWeight = 0;
          } else if (assignmentType === "MIXED") {
            const defaultTotal = resolvedWeightBasis === "points" ? totalPoints : 100;
            groupWeight = defaultTotal - (Number.isFinite(individualWeight) ? individualWeight : defaultTotal / 2);
          } else {
            groupWeight = resolvedWeightBasis === "points" ? totalPoints : 100;
          }
        }

        const convertedRubric = {
          id: assignmentData.id + "_rubric",
          name: rubricMetaInfo?.name || `${mappedAssignment.title} Rubric`,
          description: rubricMetaInfo?.description || "",
          totalPoints,
          weightBasis: resolvedWeightBasis,
          individualWeight: Number(individualWeight) || 0,
          groupWeight: Number(groupWeight) || 0,
          criteria: convertedCriteria,
        };

        console.log("[Rubric Config] Rubric loaded:", {
          criteriaCount: convertedCriteria.length,
          totalPoints: convertedRubric.totalPoints,
          criterionTypeCoercions,
          usedSplitRubrics,
        });

        setRubric(convertedRubric);
        setRequiresCriterionTypeReview(!usedSplitRubrics && criterionTypeCoercions > 0);
        setCriterionTypeReviewDismissed(usedSplitRubrics);
        setHasChanges(false);
      } else {
        // Initialize with default criterion
        const defaultTotal = rubric.weightBasis === "points" ? (Number(rubric.totalPoints) || 100) : 100;
        const isMixedAssignment = assignmentType === "MIXED";
        const defaultIndividualWeight = assignmentType === "GROUP"
          ? 0
          : isMixedAssignment
            ? defaultTotal / 2
            : defaultTotal;
        const defaultGroupWeight = assignmentType === "INDIVIDUAL"
          ? 0
          : isMixedAssignment
            ? defaultTotal - defaultIndividualWeight
            : defaultTotal;

        setRubric((r) => ({
          ...r,
          name: `${mappedAssignment.title} Rubric`,
          individualWeight: defaultIndividualWeight,
          groupWeight: defaultGroupWeight,
          criteria: [createDefaultCriterion()],
        }));
        setRequiresCriterionTypeReview(false);
        setCriterionTypeReviewDismissed(false);
      }
    } catch (error) {
      console.error("Error loading rubric data:", error);
      showNotification("error", error.message || "Failed to load rubric configuration");
      // Still hide welcome on error
      setShowWelcome(false);
    } finally {
      setIsLoading(false);
    }
  }, [params.courseId, params.assignmentId, showNotification]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();

    // Ensure welcome animation doesn't get stuck
    const welcomeTimer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);

    return () => clearTimeout(welcomeTimer);
  }, [fetchData]);

  // Generate automatic criterion naming
  const generateCriteriaTitle = (existingCriteria, isNew = true) => {
    if (isNew) {
      const nextNumber = existingCriteria.length + 1;
      return `Criterion ${nextNumber}`;
    } else {
      // For duplicates
      return `Criterion ${existingCriteria.length} (Copy)`;
    }
  };

  const createDefaultCriterion = (isNew = true, overrides = {}) => {
    const existingCriteria = rubric.criteria || [];
    const assignmentType = normalizeAssignmentType(assignment?.type);
    const { value: criterionTypeValue } = coerceCriterionType(overrides.criterionType, assignmentType);
    const baseId = overrides.criterionId || overrides.id || generateCriterionId();
    const generatedTitle = overrides.title || generateCriteriaTitle(existingCriteria, isNew);

    const resolvedLevels = (overrides.levels || [
      {
        description: "Outstanding",
        minPoints: 90,
        maxPoints: 100,
      },
      {
        description: "Very Good",
        minPoints: 80,
        maxPoints: 89,
      },
      {
        description: "Good",
        minPoints: 70,
        maxPoints: 79,
      },
      {
        description: "Satisfactory",
        minPoints: 60,
        maxPoints: 69,
      },
      {
        description: "Needs Improvement",
        minPoints: 0,
        maxPoints: 59,
      },
    ]).map((level, index) => ({
      id: level.id || `${baseId}-level-${index}`,
      description: level.description || `Level ${index + 1}`,
      minPoints: Number(level.minPoints ?? level.startPoint ?? 0),
      maxPoints: Number(level.maxPoints ?? level.endPoint ?? 0),
      color: level.color || "blue",
      comments: Array.isArray(level.comments)
        ? level.comments.map((comment, commentIndex) => ({
            id: comment.id || `${baseId}-lvl-${index}-comment-${commentIndex}`,
            text: typeof comment === "string" ? comment : comment.text,
          }))
        : [],
    }));

    return {
      id: overrides.id || baseId,
      criterionId: baseId,
      title: generatedTitle,
      description: overrides.description || generatedTitle,
      criterionType: criterionTypeValue,
      weight: typeof overrides.weight === "number" ? overrides.weight : 100,
      markingScale: overrides.markingScale || "descriptive",
      levels: resolvedLevels,
      comments: Array.isArray(overrides.comments) ? overrides.comments : [],
    };
  };

  // Handlers
  const [lastAddedId, setLastAddedId] = useState(null);

  const handleAddCriterion = () => {
    const newCriterion = createDefaultCriterion(true);
    setRubric({
      ...rubric,
      criteria: [...(rubric.criteria || []), newCriterion],
    });
    setLastAddedId(newCriterion.id);
    setHasChanges(true);
    showNotification("success", "New criterion has been added to the rubric");
  };

  const handleUpdateCriterion = (index, updatedCriterion) => {
    const assignmentType = normalizeAssignmentType(assignment?.type);
    const { value: criterionTypeValue } = coerceCriterionType(updatedCriterion.criterionType, assignmentType);
    const resolvedCriterionId = updatedCriterion.criterionId || updatedCriterion.id || generateCriterionId();

    const newCriteria = [...(rubric.criteria || [])];
    const syncedTitle = (updatedCriterion.title || "").toString();
    newCriteria[index] = {
      ...updatedCriterion,
      title: syncedTitle,
      description: syncedTitle,
      criterionType: criterionTypeValue,
      criterionId: resolvedCriterionId,
      id: updatedCriterion.id || resolvedCriterionId,
    };

    setRubric({ ...rubric, criteria: newCriteria });
    setHasChanges(true);
  };


  const handleDeleteCriterion = (index) => {
    if (!rubric.criteria || rubric.criteria.length === 1) {
      showNotification("error", "Rubric must have at least one criterion");
      return;
    }

    const newCriteria = rubric.criteria.filter((_, i) => i !== index);
    setRubric({ ...rubric, criteria: newCriteria });
    setHasChanges(true);
    showNotification("success", "Criterion has been removed from the rubric");
  };

  const handleDuplicateCriterion = (index) => {
    if (!rubric.criteria || !rubric.criteria[index]) return;
    const criterionToDuplicate = rubric.criteria[index];
    const baseId = generateCriterionId();
    const duplicateTitle = criterionToDuplicate.title
      ? `${criterionToDuplicate.title} (Copy)`
      : generateCriteriaTitle(rubric.criteria, false);

    const duplicatedCriterion = {
      ...criterionToDuplicate,
      id: baseId,
      criterionId: baseId,
      title: duplicateTitle,
      description: duplicateTitle,
      levels: (criterionToDuplicate.levels || []).map((level, levelIndex) => ({
        ...level,
        id: `${baseId}-level-${levelIndex}`,
        comments: (level.comments || []).map((comment, commentIndex) => ({
          ...comment,
          id: `${baseId}-lvl-${levelIndex}-comment-${commentIndex}`,
        })),
      })),
      comments: (criterionToDuplicate.comments || []).map((comment, commentIndex) => ({
        ...comment,
        id: `${baseId}-criterion-comment-${commentIndex}`,
      })),
    };

    const newCriteria = [...(rubric.criteria || [])];
    newCriteria.splice(index + 1, 0, duplicatedCriterion);
    setRubric({ ...rubric, criteria: newCriteria });
    setHasChanges(true);
    showNotification("success", "Criterion has been duplicated successfully");
  };



  // Check for overlapping score ranges
  const hasScoreRangeOverlap = () => {
    if (!rubric.criteria || rubric.criteria.length === 0) return false;
    
    for (const criterion of rubric.criteria) {
      if (!criterion.levels || criterion.levels.length <= 1) continue;
      
      // Check if current criterion's levels overlap
      for (let i = 0; i < criterion.levels.length; i++) {
        const level1 = criterion.levels[i];
        const min1 = level1.minPoints || 0;
        const max1 = level1.maxPoints || 0;
        
        if (min1 > max1) return true; // Min greater than max
        
        for (let j = i + 1; j < criterion.levels.length; j++) {
          const level2 = criterion.levels[j];
          const min2 = level2.minPoints || 0;
          const max2 = level2.maxPoints || 0;
          
          // Check for overlap
          const hasOverlap = 
            (min1 >= min2 && min1 <= max2) || // level1 min within level2 range
            (max1 >= min2 && max1 <= max2) || // level1 max within level2 range
            (min1 <= min2 && max1 >= max2);   // level1 range contains level2 range
          
          if (hasOverlap) return true;
        }
      }
    }
    
    return false;
  };

  const hasScoreOutOfRange = useCallback(() => {
    if (!Array.isArray(rubric.criteria) || rubric.criteria.length === 0) return false;

    for (const criterion of rubric.criteria) {
      const levels = Array.isArray(criterion?.levels) ? criterion.levels : [];
      for (const level of levels) {
        const min = Number(level?.minPoints ?? 0);
        const max = Number(level?.maxPoints ?? 0);
        if (!Number.isFinite(min) || !Number.isFinite(max)) {
          return true;
        }
        if (min < 0 || max < 0 || min > 100 || max > 100) {
          return true;
        }
      }
    }

    return false;
  }, [rubric.criteria]);

  const assignmentType = useMemo(
    () => normalizeAssignmentType(assignment?.type),
    [assignment?.type]
  );

  const recommendedCriterionType = useMemo(
    () => recommendCriterionTypeForAssignment(assignmentType),
    [assignmentType]
  );

  const expectedWeightTotal = useMemo(() => (
    rubric.weightBasis === 'percentage'
      ? 100
      : (Number(rubric.totalPoints) || 0)
  ), [rubric.weightBasis, rubric.totalPoints]);

  const typeWeightTargets = useMemo(() => ({
    INDIVIDUAL: Number(rubric.individualWeight) || 0,
    GROUP: Number(rubric.groupWeight) || 0,
  }), [rubric.individualWeight, rubric.groupWeight]);

  const criterionTypeTotals = useMemo(() => {
    const totals = CRITERION_TYPE_OPTIONS.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});
    (rubric.criteria || []).forEach((criterion) => {
      const normalized = (criterion.criterionType || "").toString().trim().toUpperCase();
      if (CRITERION_TYPE_OPTIONS.includes(normalized)) {
        totals[normalized] = (totals[normalized] || 0) + (Number(criterion.weight) || 0);
      }
    });
    return totals;
  }, [rubric.criteria]);

  const criterionTypeOrder = useMemo(() => {
    const present = Array.from(
      new Set(
        (rubric.criteria || [])
          .map((criterion) => (criterion.criterionType || "").toString().trim().toUpperCase())
          .filter((key) => CRITERION_TYPE_OPTIONS.includes(key))
      )
    );

    const base = present.length ? present : [...CRITERION_TYPE_OPTIONS];

    if (!recommendedCriterionType) {
      return base;
    }

    const withoutRecommended = base.filter((key) => key !== recommendedCriterionType);
    const trailing = CRITERION_TYPE_OPTIONS.filter(
      (key) => key !== recommendedCriterionType && !withoutRecommended.includes(key)
    );

    return [recommendedCriterionType, ...withoutRecommended, ...trailing];
  }, [rubric.criteria, recommendedCriterionType]);

  const overallWeightTotal = useMemo(() => (
    (rubric.criteria || []).reduce((sum, criterion) => sum + (Number(criterion.weight) || 0), 0)
  ), [rubric.criteria]);

  const displayWeightTolerance = useMemo(
    () => (rubric.weightBasis === 'percentage' ? 0.5 : 0.01),
    [rubric.weightBasis]
  );

  const criterionTypeStatusList = useMemo(() => {
    const tolerance = rubric.weightBasis === 'percentage' ? 0.5 : 0.01;
    return criterionTypeOrder.map((typeKey) => {
      const total = criterionTypeTotals[typeKey] || 0;
      const expected = typeWeightTargets[typeKey] ?? 0;
      const diff = Math.abs(total - expected);
      const label = CRITERION_TYPE_LABELS[typeKey] || typeKey;
      const hasAnyWeight = total > 0;
      const isRecommended = !recommendedCriterionType || typeKey === recommendedCriterionType;

      let tone = 'muted';
      if (expected === 0 && total === 0) {
        tone = 'muted';
      } else if (diff <= tolerance) {
        tone = 'ok';
      } else if (hasAnyWeight && !isRecommended) {
        tone = 'warn';
      } else {
        tone = 'warn';
      }

      return {
        key: typeKey,
        label,
        total,
        expected,
        diff,
        tone,
        hasAnyWeight,
      };
    });
  }, [criterionTypeOrder, criterionTypeTotals, recommendedCriterionType, rubric.weightBasis, typeWeightTargets]);

  const criterionTypeOptions = CRITERION_TYPE_OPTIONS;

  const crossCriterionTypeUsage = useMemo(() => {
    if (!recommendedCriterionType) return false;
    return criterionTypeStatusList.some(
      (status) => status.key !== recommendedCriterionType && status.hasAnyWeight
    );
  }, [criterionTypeStatusList, recommendedCriterionType]);

  const handleSaveRubric = async () => {
    // Validate rubric
    if (!rubric.name.trim()) {
      showNotification("error", "Please provide a name for the rubric");
      return;
    }

    if (!rubric.criteria || rubric.criteria.length === 0) {
      showNotification("error", "Rubric must have at least one criterion");
      return;
    }

    // Validate no score range overlap
    if (hasScoreRangeOverlap()) {
      showNotification("error", "Cannot save: Score ranges cannot overlap within criteria");
      return;
    }

    if (hasScoreOutOfRange()) {
      showNotification("error", "Cannot save: Points must stay between 0 and 100");
      return;
    }

    const sanitizedCriteria = (rubric.criteria || []).map((criterion, index) => {
      const resolvedCriterionId = criterion.criterionId || criterion.id || generateCriterionId();
      const { value: criterionTypeValue } = coerceCriterionType(criterion.criterionType, assignmentType);
      const trimmedTitle = (criterion.title || "").toString().trim() || `Criterion ${index + 1}`;

      return {
        ...criterion,
        id: criterion.id || resolvedCriterionId,
        criterionId: resolvedCriterionId,
        title: trimmedTitle,
        description: trimmedTitle,
        criterionType: criterionTypeValue,
        weight: Number(criterion.weight) || 0,
        levels: (criterion.levels || []).map((level, levelIndex) => ({
          ...level,
          id: level.id || `${resolvedCriterionId}-level-${levelIndex}`,
          description: (level.description || `Level ${levelIndex + 1}`).toString(),
          minPoints: Number(level.minPoints ?? level.startPoint ?? 0),
          maxPoints: Number(level.maxPoints ?? level.endPoint ?? 0),
          comments: Array.isArray(level.comments)
            ? level.comments
                .filter((comment) => {
                  const text = typeof comment === "string" ? comment : comment.text;
                  return Boolean(text && text.toString().trim().length);
                })
                .map((comment, commentIndex) => ({
                  id: comment.id || `${resolvedCriterionId}-lvl-${levelIndex}-comment-${commentIndex}`,
                  text: (typeof comment === "string" ? comment : comment.text).toString().trim(),
                }))
            : [],
        })),
      };
    });

    const hasOutOfRangeAfterSanitize = sanitizedCriteria.some((criterion) =>
      (criterion.levels || []).some((level) =>
        level.minPoints < 0 ||
        level.maxPoints < 0 ||
        level.minPoints > 100 ||
        level.maxPoints > 100
      )
    );

    if (hasOutOfRangeAfterSanitize) {
      showNotification("error", "Cannot save: Points must stay between 0 and 100");
      return;
    }

    if (sanitizedCriteria.some((criterion) => !criterion.title || !criterion.title.trim())) {
      showNotification("error", "Each criterion needs a title before saving");
      return;
    }

    if (sanitizedCriteria.some((criterion) => !criterion.criterionType)) {
      showNotification("error", "Each criterion must be assigned a criterion type");
      return;
    }

    const individualWeightTarget = Number(rubric.individualWeight) || 0;
    const groupWeightTarget = Number(rubric.groupWeight) || 0;
    const weightTargetSum = individualWeightTarget + groupWeightTarget;
    const weightTolerance = rubric.weightBasis === 'percentage' ? 0.5 : 0.01;
    const weightUnitLabel = rubric.weightBasis === 'percentage' ? '%' : ' pts';

    if (Math.abs(weightTargetSum - expectedWeightTotal) > weightTolerance) {
      showNotification(
        "error",
        `Individual and group weights total ${weightTargetSum}${weightUnitLabel}, but should equal ${expectedWeightTotal}${weightUnitLabel}`
      );
      return;
    }

    const total = sanitizedCriteria.reduce((sum, c) => sum + (c.weight || 0), 0);
    if (Math.abs(total - expectedWeightTotal) > weightTolerance) {
      showNotification(
        "error",
        `Total ${rubric.weightBasis === 'percentage' ? 'weight' : 'points'} is ${total} (must equal ${expectedWeightTotal})`
      );
      return;
    }

    const totalsByCriterionType = sanitizedCriteria.reduce((acc, criterion) => {
      const key = (criterion.criterionType || "").toUpperCase();
      acc[key] = (acc[key] || 0) + (criterion.weight || 0);
      return acc;
    }, CRITERION_TYPE_OPTIONS.reduce((base, key) => ({ ...base, [key]: 0 }), {}));

    const targetWeightsByType = {
      INDIVIDUAL: individualWeightTarget,
      GROUP: groupWeightTarget,
    };

    for (const typeKey of CRITERION_TYPE_OPTIONS) {
      const expected = targetWeightsByType[typeKey] ?? 0;
      const actual = totalsByCriterionType[typeKey] || 0;
      if (Math.abs(actual - expected) > weightTolerance) {
        const label = CRITERION_TYPE_LABELS[typeKey] || typeKey;
        showNotification(
          "error",
          `${label} criteria total ${actual}${weightUnitLabel} does not match the configured ${expected}${weightUnitLabel}`
        );
        return;
      }
    }

    if (recommendedCriterionType && (totalsByCriterionType[recommendedCriterionType] || 0) === 0) {
      const label = CRITERION_TYPE_LABELS[recommendedCriterionType] || recommendedCriterionType;
      showNotification(
        "warning",
        `${label} criterion type currently has no weighted criteria. This assignment is marked as ${recommendedCriterionType.toLowerCase()} – double-check before saving.`
      );
    }

    if (recommendedCriterionType) {
      const outOfTypeCriteria = CRITERION_TYPE_OPTIONS.filter(
        (type) => type !== recommendedCriterionType && (totalsByCriterionType[type] || 0) > 0
      );
      if (outOfTypeCriteria.length > 0) {
        const labelList = outOfTypeCriteria.map((type) => CRITERION_TYPE_LABELS[type] || type).join(" and ");
        showNotification(
          "warning",
          `${labelList} criterion types contain weighted criteria while the assignment type is ${recommendedCriterionType.toLowerCase()}. Ensure examiners understand how to mark these criterion types.`
        );
      }
    }

    try {
      setIsSaving(true);

      const rubricSaveData = {
        ...rubric,
        criteria: sanitizedCriteria,
        assignmentId: params.assignmentId,
        courseId: params.courseId,
        // Include assignment data for the backend
        assignmentName: assignment?.title,
        assignmentDescription: assignment?.description,
        assignmentType: assignment?.type,
        startDate: assignment?.startDate,
        endDate: assignment?.dueDate,
        weight: assignment?.weight,
        status: assignment?.status,
      };

      console.log("[Rubric Config] Saving rubric:", {
        criteriaCount: sanitizedCriteria.length,
        assignmentId: params.assignmentId,
        assignmentName: assignment?.title
      });

      // Save rubric (both create and update use the same method now)
      const rubricResponse = await rubricService.createRubric(rubricSaveData);

      // Handle rubric response structure
      const savedRubric = rubricResponse?.success !== undefined ? rubricResponse.data : rubricResponse;
      if (savedRubric && savedRubric.id && !rubric.id) {
        setRubric((prev) => ({ ...prev, id: savedRubric.id }));
      }

      setHasChanges(false);
      setRequiresCriterionTypeReview(false);
      setCriterionTypeReviewDismissed(true);

      showNotification("success", "The rubric has been saved successfully");
      
      // Auto refresh data to keep UI in sync with backend
      await fetchData();
    } catch (error) {
      console.error("Save rubric error:", error);
      showNotification("error", error.response?.data?.message || error.message || "Failed to save rubric");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading rubric configuration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Welcome Animation Overlay - Consistent Style */}
      {showWelcome && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-sm animate-fade-in cursor-pointer"
          onClick={() => setShowWelcome(false)}
        >
          <div className="text-center text-white animate-scale-in">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Award className="w-20 h-20 text-yellow-400 animate-bounce-slow" />
                <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 animate-slide-up">
              Rubric Configuration
            </h1>
            <p className="text-xl opacity-90 animate-slide-up animation-delay-200">
              Create meaningful assessment criteria for {assignment?.title}
            </p>
            <p className="text-sm opacity-70 mt-6 animate-fade-in">
              Click anywhere to continue
            </p>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation - Consistent Style */}
      <div className="mb-4">
        <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <ol className="flex items-center space-x-2">
            <li className="flex items-center">
              <Link
                href="/admin"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-1">
                  OAS
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  Dashboard
                </span>
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2"></i>
              <Link
                href="/admin/courses"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Courses
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2"></i>
              <Link
                href={`/admin/courses/${params.courseId}/assignments`}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {course?.courseCode || "Course"}
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2"></i>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {assignment?.title || "Assignment"} - Rubric
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Page Header - Consistent Style */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Award className="w-8 h-8 text-purple-600 mr-3" />
              Rubric Configuration
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Define assessment criteria and performance levels for{" "}
              {assignment ? (assignment.title || assignment.name || 'this assignment') : 'this assignment'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                console.log("[Rubric Config] Toggle preview:", !showPreview);
                setShowPreview(!showPreview);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
            >
              {showPreview ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
              {showPreview ? "Hide" : "Show"} Preview
            </button>
            
            {/* Save button with validation status */}
            <div className="relative">
              {(() => {
                const total = (rubric.criteria || []).reduce((s,c)=> s + (c.weight||0), 0);
                const expected = rubric.weightBasis === 'percentage' ? 100 : (rubric.totalPoints || 0);
                const weightOk = total === expected;
                const outOfRange = hasScoreOutOfRange();
                const rangeOverlap = hasScoreRangeOverlap();
                const disabled = isSaving || rangeOverlap || outOfRange || !weightOk;
                const disableReason = rangeOverlap
                  ? "Cannot save: Score ranges overlap"
                  : outOfRange
                    ? "Cannot save: Points must stay between 0 and 100"
                    : !weightOk
                      ? "Cannot save: Total weight/points mismatch"
                      : "";
                return (
              <button
                onClick={handleSaveRubric}
                disabled={disabled}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                  !isSaving && !rangeOverlap && !outOfRange && weightOk
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                }`}
                title={disableReason}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Rubric
                    {(rangeOverlap || outOfRange || !weightOk) && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </>
                )}
              </button>
                );})()}
              
              {/* Error tooltip when hovering over disabled button */}
              {hasScoreRangeOverlap() && (
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  Score ranges cannot overlap
                </div>
              )}
              {hasScoreOutOfRange() && !hasScoreRangeOverlap() && (
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  Points must stay between 0 and 100
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips Section - Consistent with Other Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
        <div className="dashboard-card">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 text-purple-600 mr-2" />
              Assignment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Course:
                  </span>
                  <span className="font-medium">
                    {course?.courseCode || "Loading..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Assignment Name:
                  </span>
                  <span
                    className="font-medium text-right"
                    title={assignment ? (assignment.name || assignment.title || '') : ''}
                  >
                    {assignment ? (assignment.name || assignment.title || "Untitled assignment") : "Loading..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Type:
                  </span>
                  <span className="font-medium capitalize">
                    {assignment ? (assignment.type ? assignment.type : "not set") : "Loading..."}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Points:
                  </span>
                  <span className="font-medium">{rubric.totalPoints}</span>
                </div>
                {assignment?.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Due Date:
                    </span>
                    <span className="font-medium text-right">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Criteria:
                  </span>
                  <span className="font-medium">
                    {rubric.criteria?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Criteria Builder */}
        <div className={`space-y-6 ${showPreview ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          {/* Rubric Info */}
          <div className="dashboard-card">
            <div className="p-6">
              {requiresCriterionTypeReview && !criterionTypeReviewDismissed && (
                <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                          Criterion types need a quick review
                        </p>
                        <p className="text-xs text-amber-700/80 dark:text-amber-200/80 mt-1">
                          We applied default criterion types to legacy criteria. Confirm each criterion targets the correct type before saving.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCriterionTypeReviewDismissed(true)}
                      className="self-start md:self-auto px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                    >
                      Mark as reviewed
                    </button>
                  </div>
                </div>
              )}
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 text-purple-600 mr-2" />
                Rubric Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rubric Name
                  </label>
                  <input
                    type="text"
                    value={rubric.name || ''}
                    onChange={(e) => {
                      setRubric({ ...rubric, name: e.target.value });
                      setHasChanges(true);
                    }}
                    className="form-control w-full"
                    placeholder="Enter rubric name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={rubric.description || ''}
                    onChange={(e) => {
                      setRubric({ ...rubric, description: e.target.value });
                      setHasChanges(true);
                    }}
                    className="form-control w-full"
                    rows={2}
                    placeholder="Brief description of this rubric"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {rubric.weightBasis === 'percentage' ? 'Total Percentage' : 'Total Points'}
                  </label>
                  <input
                    type="number"
                    value={rubric.totalPoints ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setRubric({ ...rubric, totalPoints: '' });
                      } else {
                        const numValue = parseInt(value);
                        setRubric({
                          ...rubric,
                          totalPoints: Number.isFinite(numValue) ? numValue : ''
                        });
                      }
                      setHasChanges(true);
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value === '' || !Number.isFinite(parseInt(value))) {
                        setRubric({ ...rubric, totalPoints: 100 });
                      }
                    }}
                    className="form-control w-full max-w-xs"
                    min={1}
                    max={1000}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Weighting Basis
                  </label>
                  <select
                    value={rubric.weightBasis}
                    onChange={(e) => {
                      const basis = e.target.value;
                      setRubric({ ...rubric, weightBasis: basis });
                      setHasChanges(true);
                    }}
                    className="form-control w-full max-w-xs"
                  >
                    <option value="percentage">Percentage (sum = 100%)</option>
                    <option value="points">Points (sum = Total Points)</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Choose how to allocate criterion weights: as percentages or absolute points.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Weight Distribution
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Individual Weight ({rubric.weightBasis === 'percentage' ? '%' : 'pts'})
                      </p>
                      <input
                        type="number"
                        value={rubric.individualWeight ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRubric({
                            ...rubric,
                            individualWeight: value === '' ? '' : Number(value),
                          });
                          setHasChanges(true);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            setRubric({
                              ...rubric,
                              individualWeight: 0,
                            });
                          }
                        }}
                        className="form-control"
                        min={0}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Group Weight ({rubric.weightBasis === 'percentage' ? '%' : 'pts'})
                      </p>
                      <input
                        type="number"
                        value={rubric.groupWeight ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRubric({
                            ...rubric,
                            groupWeight: value === '' ? '' : Number(value),
                          });
                          setHasChanges(true);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            setRubric({
                              ...rubric,
                              groupWeight: 0,
                            });
                          }
                        }}
                        className="form-control"
                        min={0}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    The two weights must add up to the total {rubric.weightBasis === 'percentage' ? 'percentage (100%)' : `points (${rubric.totalPoints || 0})`}. We'll alert you if they drift from the criterion totals.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Criteria List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                <Award className="w-5 h-5 text-purple-600 mr-2" />
                Assessment Criteria
              </h3>
              <button
                onClick={handleAddCriterion}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Criterion
              </button>
            </div>

            {criterionTypeStatusList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {criterionTypeStatusList.map((status) => {
                  const Icon = status.key === 'GROUP' ? Users : User;
                  const unit = rubric.weightBasis === 'percentage' ? '%' : ' pts';
                  const meetsTarget = Math.abs(status.diff) <= (rubric.weightBasis === 'percentage' ? 0.5 : 0.01);
                  const hasTarget = Number(status.expected) > 0;
                  const stateClasses = status.tone === 'ok'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                    : status.tone === 'warn'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
                  const statusCopy = status.tone === 'ok'
                    ? 'Criterion type matches configured weight'
                    : status.tone === 'warn'
                      ? hasTarget
                        ? 'Actual weights differ from configured target'
                        : 'Weights configured without a target for this type'
                      : 'No criteria configured yet';
                  const valueText = hasTarget
                    ? `${status.total}${unit} / ${status.expected}${unit}`
                    : `${status.total}${unit}`;

                  return (
                    <div
                      key={status.key}
                      className={`flex items-center justify-between p-4 border rounded-lg ${stateClasses}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-white/60 dark:bg-white/10">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{status.label}</p>
                          <p className="text-xs opacity-80">{statusCopy}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span>{valueText}</span>
                        {meetsTarget ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {recommendedCriterionType && (
              <div
                className={`mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  crossCriterionTypeUsage
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-100'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                }`}
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  {crossCriterionTypeUsage ? (
                    <span>
                      Assignment type is {recommendedCriterionType.toLowerCase()}, but this rubric includes criterion types for {
                        criterionTypeStatusList
                          .filter((status) => status.key !== recommendedCriterionType && status.hasAnyWeight)
                          .map((status) => status.label.toLowerCase())
                          .join(' & ')
                      }.
                      Confirm this mix is intentional before saving.
                    </span>
                  ) : (
                    <span>
                      Assignment type is {recommendedCriterionType.toLowerCase()}. Criterion types stay editable if you need
                      to adjust the mix later.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Overall Weight Validation */}
            {rubric.criteria && rubric.criteria.length > 0 && (
              <div
                className={`p-4 rounded-lg flex items-center gap-3 ${
                  Math.abs(overallWeightTotal - expectedWeightTotal) <= displayWeightTolerance
                    ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                    : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                }`}
              >
                {Math.abs(overallWeightTotal - expectedWeightTotal) <= displayWeightTolerance ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>
                      Total {rubric.weightBasis}: {expectedWeightTotal}{rubric.weightBasis === 'percentage' ? '%' : ' pts'} ✓
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    <span>
                      Total {rubric.weightBasis}: {overallWeightTotal}{rubric.weightBasis === 'percentage' ? '%' : ' pts'} (must equal {expectedWeightTotal}{rubric.weightBasis === 'percentage' ? '%' : ' pts'})
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Criteria Components */}
            <div className="space-y-4">
              {rubric.criteria && rubric.criteria.map((criterion, index) => (
                <RubricCriterion
                  key={criterion.id}
                  criterion={criterion}
                  index={index}
                  totalCriteria={rubric.criteria ? rubric.criteria.length : 0}
                  weightBasis={rubric.weightBasis}
                  highlight={lastAddedId === criterion.id}
                  allowedCriterionTypes={criterionTypeOptions}
                  onUpdate={(updated) => handleUpdateCriterion(index, updated)}
                  onDelete={() => handleDeleteCriterion(index)}
                  onDuplicate={() => handleDuplicateCriterion(index)}
                />
              ))}
            </div>

            {(!rubric.criteria || rubric.criteria.length === 0) && (
              <div className="text-center py-12 dashboard-card">
                <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No criteria defined yet
                </p>
                <button onClick={handleAddCriterion} className="btn-primary">
                  Add First Criterion
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview Panel */}
        {showPreview && (
          <div className="lg:col-span-6 lg:sticky lg:top-6 h-fit">
            <RubricPreview
              rubric={rubric}
              assignment={assignment}
              course={course}
            />
          </div>
        )}
      </div>
    </div>
  );
}
