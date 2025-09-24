'use client';

import RubricTable from '../assessment/RubricTable';

/**
 * Adapter to render a read-only rubric snapshot using the examiner RubricTable.
 * Accepts AssessmentReadDTO.entities[x].items and converts into criteria/selectedRatings.
 */
export default function RubricSnapshot({ title, rubricFrozen, items = [] }) {
  // Prefer full frozen rubric for Canvas-style grid
  const criteria = (rubricFrozen?.criteria || []).map((c) => ({
    criterionId: c.criterionId,
    description: c.text || c.criterionId,
    weight: c.weightPct ?? 0,
    appliesTo: c.appliesTo || 'BOTH',
    scaleType: c.scaleType || 'descriptive',
    levels: (c.levels || []).map((lvl) => ({
      levelId: lvl.levelId,
      levelLabel: lvl.levelLabel,
      levelRange: lvl.levelRange,
      description: lvl.description,
      minPoints: lvl.levelRange?.min,
      maxPoints: lvl.levelRange?.max,
    })),
  }));

  const selectedRatings = (items || []).reduce((acc, it) => {
    const min = it?.levelRange?.min ?? it?.minPoints ?? it?.points ?? 0;
    const max = it?.levelRange?.max ?? it?.maxPoints ?? it?.points ?? min;
    acc[it.criterionId] = { levelId: it.levelId, points: it.points ?? min, minPoints: min, maxPoints: max };
    return acc;
  }, {});

  // Aggregate comments to single string per criterion (line-separated)
  const comments = (items || []).reduce((acc, it) => {
    const texts = (it.comments || []).map((c) => c.text).filter(Boolean);
    if (texts.length) acc[it.criterionId] = texts.join('\n');
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>}
      <RubricTable criteria={criteria} selectedRatings={selectedRatings} comments={comments} disabled={true} assessmentType={'GROUP'} showTotals={false} />
    </div>
  );
}
