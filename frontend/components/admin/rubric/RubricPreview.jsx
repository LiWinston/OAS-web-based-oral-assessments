'use client';

import { FileText, Award, Target, MessageSquare, Users, User, AlertCircle } from 'lucide-react';

export default function RubricPreview({ rubric, assignment, course }) {

  const getLetterGrade = (index, total) => {
    const grades = [
      "A+",
      "A",
      "A-",
      "B+",
      "B",
      "B-",
      "C+",
      "C",
      "C-",
      "D",
      "F",
    ];
    const gradeIndex = Math.floor((index / (total - 1)) * (grades.length - 1));
    return grades[gradeIndex];
  };
  const normalizedAssignmentType = (assignment?.type || '').toUpperCase();
  const basis = rubric.weightBasis || 'percentage';
  const weightUnit = basis === 'percentage' ? '%' : ' pts';
  const expectedTotal = basis === 'percentage' ? 100 : (rubric.totalPoints || 0);

  const COMPONENT_OPTIONS = ['INDIVIDUAL', 'GROUP'];

  const uniqueComponents = Array.from(new Set(
    (rubric.criteria || [])
      .map((criterion) => (criterion.criterionType || criterion.component || '').toUpperCase())
      .filter((component) => COMPONENT_OPTIONS.includes(component))
  ));

  const recommendedComponent = normalizedAssignmentType === 'INDIVIDUAL'
    ? 'INDIVIDUAL'
    : normalizedAssignmentType === 'GROUP'
      ? 'GROUP'
      : null;

  const componentOrder = (() => {
    const base = uniqueComponents.length ? uniqueComponents : [...COMPONENT_OPTIONS];
    if (!recommendedComponent) {
      return base;
    }
    const withoutRecommended = base.filter((key) => key !== recommendedComponent);
    const trailing = COMPONENT_OPTIONS.filter(
      (key) => key !== recommendedComponent && !withoutRecommended.includes(key)
    );
    return [recommendedComponent, ...withoutRecommended, ...trailing];
  })();

  const criterionTypeLabels = {
    INDIVIDUAL: 'Individual',
    GROUP: 'Group',
  };

  const componentIcons = {
    INDIVIDUAL: <User className="w-4 h-4" />,
    GROUP: <Users className="w-4 h-4" />,
  };

  const groupedCriteria = COMPONENT_OPTIONS.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {});

  const componentTotals = COMPONENT_OPTIONS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

  const configuredWeights = COMPONENT_OPTIONS.reduce((acc, key) => {
    const value = Number(rubric?.[key === 'INDIVIDUAL' ? 'individualWeight' : 'groupWeight']) || 0;
    acc[key] = value;
    return acc;
  }, {});

  (rubric.criteria || []).forEach((criterion) => {
    const normalizedComponent = (criterion.criterionType || criterion.component || '').toUpperCase();
    const fallbackComponent = recommendedComponent || 'INDIVIDUAL';
    const targetComponent = COMPONENT_OPTIONS.includes(normalizedComponent)
      ? normalizedComponent
      : fallbackComponent;

    componentTotals[targetComponent] = (componentTotals[targetComponent] || 0) + (Number(criterion.weight) || 0);
    groupedCriteria[targetComponent] = groupedCriteria[targetComponent] || [];
    groupedCriteria[targetComponent].push(criterion);
  });

  const allCriteria = rubric.criteria || [];
  const totalWeight = (rubric.criteria || []).reduce((sum, c) => sum + (c.weight || 0), 0);

  return (
    <div className="dashboard-card animate-fade-in sticky top-6">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Rubric Preview
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Examiner View
          </span>
        </div>

        {/* Rubric Info */}
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            {rubric.name || 'Untitled Rubric'}
          </h4>
          {rubric.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {rubric.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Total Points: <strong>{rubric.totalPoints}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Criteria: <strong>{rubric.criteria ? rubric.criteria.length : 0}</strong>
              </span>
            </div>
          </div>

          {componentOrder.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-3">
              {componentOrder.map((componentKey) => {
                const total = componentTotals[componentKey] || 0;
                const configured = configuredWeights[componentKey] || 0;
                const tolerance = rubric.weightBasis === 'percentage' ? 0.5 : 0.01;
                const meetsConfigured = Math.abs(total - configured) <= tolerance;
                const hasCriteria = (groupedCriteria[componentKey] || []).length > 0;
                const statusClasses = meetsConfigured && hasCriteria
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  : hasCriteria
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
                return (
                  <div
                    key={componentKey}
                    className={`flex items-center justify-between p-3 border rounded-lg ${statusClasses}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-white/60 dark:bg-white/10">
                        {componentIcons[componentKey] || <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{criterionTypeLabels[componentKey] || componentKey}</p>
                        <p className="text-xs opacity-80">
                          {hasCriteria
                            ? meetsConfigured
                              ? 'Criteria aligned with configured weight'
                              : 'Criteria total differs from configured weight'
                            : 'No criteria configured yet'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {total}{weightUnit}
                      {configured > 0 && (
                        <span className="text-xs font-normal opacity-80">{` / ${configured}${weightUnit}`}</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Weight Validation (basis-aware) */}
          {totalWeight !== expectedTotal && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Total {basis} is {totalWeight}{weightUnit} (should be {expectedTotal}{weightUnit})
              </p>
            </div>
          )}
        </div>

        {/* Preview Content */}
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {!allCriteria.length ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No criteria defined yet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Add criteria to see the preview
              </p>
            </div>
          ) : (
            componentOrder.map((componentKey) => {
              const componentCriteria = groupedCriteria[componentKey] || [];
              return (
                <div key={componentKey} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200">
                        {componentIcons[componentKey] || <User className="w-4 h-4" />}
                      </span>
                      <div>
                        <h5 className="text-sm font-semibold">{criterionTypeLabels[componentKey] || componentKey}</h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {componentCriteria.length} criterion{componentCriteria.length === 1 ? '' : 'a'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {componentTotals[componentKey] || 0}{weightUnit}
                    </span>
                  </div>

                  {componentCriteria.length === 0 ? (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded text-xs text-gray-500 dark:text-gray-400">
                      Not assessed for this criterion type yet.
                    </div>
                  ) : (
                    componentCriteria.map((criterion) => {
                      const globalIndex = allCriteria.findIndex((item) => item.id === criterion.id);
                      const displayIndex = globalIndex >= 0 ? globalIndex + 1 : undefined;
                      return (
                        <div key={criterion.id} className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {typeof displayIndex === 'number' && (
                                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    #{displayIndex}
                                  </span>
                                )}
                                <h6 className="font-semibold text-gray-900 dark:text-white">
                                  {criterion.title}
                                </h6>
                                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                                  {criterion.weight}{weightUnit}
                                </span>
                              </div>
                              {criterion.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {criterion.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            {(criterion.levels || []).map((level, levelIndex) => (
                              <div
                                key={level.id || `${criterion.id}-level-${levelIndex}`}
                                className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm">
                                    Level {levelIndex + 1}
                                    {criterion.markingScale === 'letter' && ` (${getLetterGrade(levelIndex, (criterion.levels || []).length)})`}
                                  </span>
                                  <span className="text-xs font-medium">
                                    {level.minPoints}-{level.maxPoints} pts
                                  </span>
                                </div>
                                {level.description && (
                                  <p className="text-xs opacity-80">
                                    {level.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>

                          {Array.isArray(criterion.comments) && criterion.comments.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Predefined Comments ({criterion.comments.length})
                                </span>
                              </div>
                              <div className="space-y-1">
                                {criterion.comments.slice(0, 3).map((comment) => {
                                  const levelIndex = (criterion.levels || []).findIndex((lvl) => lvl.id === comment.levelId);
                                  const levelTitle = levelIndex >= 0
                                    ? `Level ${levelIndex + 1}${criterion.markingScale === 'letter' ? ` (${getLetterGrade(levelIndex, (criterion.levels || []).length)})` : ''}`
                                    : 'Level';
                                  return (
                                    <div key={comment.id} className="text-xs text-gray-500 dark:text-gray-400 italic">
                                      <span className="font-medium">{levelTitle}:</span> "{comment.text}"
                                    </div>
                                  );
                                })}
                                {criterion.comments.length > 3 && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    +{criterion.comments.length - 3} more...
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Assignment Context */}
        {assignment && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p><strong>Assignment:</strong> {assignment.title}</p>
              <p><strong>Course:</strong> {course?.courseCode} - {course?.courseName}</p>
              <p><strong>Type:</strong> {assignment.type}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
