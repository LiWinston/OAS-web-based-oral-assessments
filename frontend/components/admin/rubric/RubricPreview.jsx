'use client';

import { FileText, Award, Target, Star, Hash, MessageSquare } from 'lucide-react';

export default function RubricPreview({ rubric, assignment, course }) {
  const getLevelColorClasses = (color) => {
    const colorMap = {
      green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
      yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
      orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
      red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
      gray: 'bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
    };
    return colorMap[color] || colorMap.gray;
  };

  const getScaleIcon = (scale) => {
    switch (scale) {
      case 'descriptive':
        return <Star className="w-4 h-4" />;
      case 'letter':
        return <span className="text-sm font-bold">A</span>;
      case 'numeric':
        return <Hash className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const totalWeight = rubric.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);

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
                Criteria: <strong>{rubric.criteria.length}</strong>
              </span>
            </div>
          </div>
          
          {/* Weight Validation */}
          {totalWeight !== 100 && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                ⚠️ Total weight is {totalWeight}% (should be 100%)
              </p>
            </div>
          )}
        </div>

        {/* Preview Content */}
        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
          {rubric.criteria.length === 0 ? (
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
            rubric.criteria.map((criterion, index) => (
              <div key={criterion.id} className="space-y-3">
                {/* Criterion Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        #{index + 1}
                      </span>
                      <h5 className="font-semibold text-gray-900 dark:text-white">
                        {criterion.title}
                      </h5>
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                        {criterion.weight}%
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        {getScaleIcon(criterion.markingScale)}
                        <span>{criterion.markingScale === 'descriptive' ? 'Descriptive' : 
                               criterion.markingScale === 'letter' ? 'Letter' : 'Numeric'}</span>
                      </div>
                    </div>
                    {criterion.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {criterion.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Performance Levels Grid */}
                <div className="grid grid-cols-1 gap-2">
                  {criterion.levels.map((level, levelIndex) => (
                    <div
                      key={level.id}
                      className={`p-3 rounded-lg border ${getLevelColorClasses(level.color)} transition-all hover:shadow-sm`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {level.name}
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

                {/* Predefined Comments */}
                {criterion.comments.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Predefined Comments ({criterion.comments.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {criterion.comments.slice(0, 3).map(comment => {
                        const level = criterion.levels.find(l => l.id === comment.levelId);
                        return (
                          <div key={comment.id} className="text-xs text-gray-500 dark:text-gray-400 italic">
                            <span className="font-medium">{level?.name}:</span> "{comment.text}"
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

                {/* Divider */}
                {index < rubric.criteria.length - 1 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-4"></div>
                )}
              </div>
            ))
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