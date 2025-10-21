'use client';

import RubricTable from '../../examiner/assessment/RubricTable';

const normalizeKey = (value) => (value || '').toString().trim().toLowerCase();

const buildPerformanceLevels = (definitionEntry = []) => {
  const levels = definitionEntry.performanceLevel || definitionEntry.levels || [];
  return levels.map((level, idx) => {
    const min = level?.startPoint ?? level?.minPoints ?? level?.levelRange?.min ?? 0;
    const max = level?.endPoint ?? level?.maxPoints ?? level?.levelRange?.max ?? min;
    return {
      levelId: level?.levelId || `L${idx + 1}`,
      description: level?.description || level?.levelLabel || `Level ${idx + 1}`,
      levelLabel: level?.levelLabel || level?.description || `Level ${idx + 1}`,
      minPoints: min,
      maxPoints: max,
      levelRange: { min, max },
      preDefinedComment: level?.preDefinedComment || [],
    };
  });
};

const mapCriteriaForRubricTable = (section, definition) => {
  const definitionsList = section.sectionType === 'GROUP'
    ? definition?.groupRubrics || []
    : definition?.individualRubrics || [];

  const definitionByKey = new Map();
  definitionsList.forEach((entry) => {
    definitionByKey.set(normalizeKey(entry.description || entry.title || ''), entry);
  });

  return section.criteria.map((criterion) => {
    const defEntry = definitionByKey.get(normalizeKey(criterion.name)) || {};
    const performanceLevel = buildPerformanceLevels(defEntry);
    const maxFromLevels = performanceLevel.reduce((acc, level) => {
      const upper = level?.maxPoints ?? level?.levelRange?.max;
      return typeof upper === 'number' ? Math.max(acc, upper) : acc;
    }, 0);
    return {
      criterionId: criterion.criterionId,
      description: criterion.name,
      appliesTo: section.sectionType,
      weight: criterion.weight ?? defEntry.weight ?? null,
      scaleType: defEntry.scaleType || 'points',
      maxPoints: maxFromLevels || null,
      performanceLevel,
    };
  });
};

const buildSelectedRatings = (section, transformedCriteria, weightBasis) => {
  const ratings = {};
  const basis = (weightBasis || '').toLowerCase() === 'percentage' ? 'percentage' : 'points';

  section.criteria.forEach((criterion) => {
    const mapped = transformedCriteria.find((c) => c.criterionId === criterion.criterionId);
    const levels = mapped?.performanceLevel || [];
    const percentageValue = typeof criterion.percentage === 'number' ? criterion.percentage : null;
    const pointsValue = percentageValue ?? (typeof criterion.finalPoints === 'number' ? criterion.finalPoints : null);

    const levelMax = levels.reduce((acc, level) => {
      const upper = level?.maxPoints ?? level?.levelRange?.max;
      return typeof upper === 'number' ? Math.max(acc, upper) : acc;
    }, 0);

    const maxPoints = basis === 'percentage'
      ? 100
      : (mapped?.maxPoints ?? (levelMax || 100));

    ratings[criterion.criterionId] = {
      levelId: null,
      points: typeof pointsValue === 'number' ? pointsValue : 0,
      minPoints: 0,
      maxPoints,
    };
  });

  return ratings;
};

const buildCommentsMap = (section) => {
  return section.criteria.reduce((acc, criterion) => {
    if (criterion.commentsCombined) {
      acc[criterion.criterionId] = criterion.commentsCombined;
    }
    return acc;
  }, {});
};

export default function ReadOnlyRubricSection({ section, definition, weightBasis, releaseMode = 'FULL' }) {
  if (!section) return null;

  const transformedCriteria = mapCriteriaForRubricTable(section, definition);
  const selectedRatings = buildSelectedRatings(section, transformedCriteria, weightBasis);
  const normalisedMode = (releaseMode || '').toString().toUpperCase();
  const showComments = normalisedMode !== 'SCORES_ONLY';
  const comments = showComments ? buildCommentsMap(section) : {};
  const scoreUnit = (weightBasis || '').toLowerCase() === 'percentage' ? '%' : 'pts';

  return (
    <RubricTable
      criteria={transformedCriteria}
      selectedRatings={selectedRatings}
      comments={comments}
      onRatingChange={() => {}}
      onCommentChange={() => {}}
      disabled
      assessmentType={section.sectionType === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'GROUP'}
      showTotals={false}
      scoreUnit={scoreUnit}
      enableComments={showComments}
    />
  );
}
