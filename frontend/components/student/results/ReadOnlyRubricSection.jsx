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
    return {
      criterionId: criterion.criterionId,
      description: criterion.name,
      appliesTo: section.sectionType,
      weight: criterion.weight ?? defEntry.weight ?? null,
      scaleType: defEntry.scaleType || 'points',
      maxPoints: criterion.maxPoints,
      performanceLevel,
    };
  });
};

const buildSelectedRatings = (section, transformedCriteria) => {
  const ratings = {};

  section.criteria.forEach((criterion) => {
    const mapped = transformedCriteria.find((c) => c.criterionId === criterion.criterionId);
    const levels = mapped?.performanceLevel || [];
    const points = typeof criterion.finalPoints === 'number' ? criterion.finalPoints : null;

    let selectedLevel = null;
    if (criterion.finalLevelLabel) {
      const key = normalizeKey(criterion.finalLevelLabel);
      selectedLevel = levels.find((lvl) => normalizeKey(lvl.levelLabel) === key || normalizeKey(lvl.description) === key);
    }
    if (!selectedLevel && points !== null) {
      selectedLevel = levels.find((lvl) => points >= (lvl.minPoints ?? lvl.levelRange?.min ?? 0)
        && points <= (lvl.maxPoints ?? lvl.levelRange?.max ?? (mapped?.maxPoints ?? points)));
    }

    ratings[criterion.criterionId] = {
      levelId: selectedLevel?.levelId || null,
      points: points,
      minPoints: selectedLevel?.minPoints ?? selectedLevel?.levelRange?.min ?? 0,
      maxPoints: selectedLevel?.maxPoints ?? selectedLevel?.levelRange?.max ?? mapped?.maxPoints ?? points ?? 0,
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

export default function ReadOnlyRubricSection({ section, definition }) {
  if (!section) return null;

  const transformedCriteria = mapCriteriaForRubricTable(section, definition);
  const selectedRatings = buildSelectedRatings(section, transformedCriteria);
  const comments = buildCommentsMap(section);

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
    />
  );
}
