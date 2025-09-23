'use client';

import { useState, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

/**
 * RubricTable Component
 * Displays and manages the rubric scoring interface for assessments
 */
export default function RubricTable({ 
  criteria, 
  selectedRatings = {}, 
  onRatingChange,
  comments = {},
  onCommentChange,
  predefinedComments = {},
  onSavePredefinedComment,
  disabled = false,
  assessmentType = 'GROUP',
  showTotals = true
}) {
  const [expandedComments, setExpandedComments] = useState({});
  const [localComments, setLocalComments] = useState(comments);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const normalizeRange = (level) => {
    // Support either min/max on level or a nested levelRange
    const min = level?.minPoints ?? level?.levelRange?.min ?? 0;
    const max = level?.maxPoints ?? level?.levelRange?.max ?? min;
    return { min, max };
  };

  const getLevelLabel = (level) => {
    return level?.levelLabel || level?.label || level?.description || (level?.levelId ? level.levelId.replace('L', 'Level ') : '');
  };

  const handleRatingSelect = (criterionId, levelId, level) => {
    if (disabled) return;
    const { min, max } = normalizeRange(level);
    const midPoint = Math.floor((min + max) / 2);
    
    // For points scale type, set wider range; for descriptive, use level range
    const criterion = criteria?.find(c => c.criterionId === criterionId);
    const isPointsScale = criterion?.scaleType === 'points';
    
    onRatingChange(criterionId, {
      levelId,
      points: midPoint,
      minPoints: isPointsScale ? 0 : min,
      maxPoints: isPointsScale ? 100 : max
    });
  };

  const handlePointsChange = (criterionId, points) => {
    if (disabled) return;
    
    const criterion = criteria?.find(c => c.criterionId === criterionId);
    const isPointsScale = criterion?.scaleType === 'points';
    const current = selectedRatings[criterionId];
    
    // Initialize rating if not exists (for points scale type)
    if (!current && isPointsScale) {
      const validPoints = Math.max(0, Math.min(100, parseInt(points) || 0));
      onRatingChange(criterionId, {
        levelId: null, // No level selected for points scale
        points: validPoints,
        minPoints: 0,
        maxPoints: 100
      });
      return;
    }
    
    if (current) {
      const validPoints = isPointsScale 
        ? Math.max(0, Math.min(100, parseInt(points) || 0)) // 0-100 for points scale
        : Math.max(current.minPoints, Math.min(current.maxPoints, parseInt(points) || 0)); // level range for descriptive
      
      onRatingChange(criterionId, {
        ...current,
        points: validPoints
      });
    }
  };

  const handleCommentChange = (criterionId, value) => {
    setLocalComments(prev => ({
      ...prev,
      [criterionId]: value
    }));
    if (onCommentChange) {
      onCommentChange(criterionId, value);
    }
  };

  const toggleCommentSection = (criterionId) => {
    setExpandedComments(prev => ({
      ...prev,
      [criterionId]: !prev[criterionId]
    }));
  };

  const addPredefinedComment = (criterionId, commentText) => {
    const currentComment = localComments[criterionId] || '';
    const newComment = currentComment ? `${currentComment}\n${commentText}` : commentText;
    handleCommentChange(criterionId, newComment);
  };

  // Filter criteria based on assessment type
  const filteredCriteria = (criteria || []).filter(criterion => {
    if (assessmentType === 'GROUP') {
      return criterion.appliesTo === 'GROUP' || criterion.appliesTo === 'BOTH';
    } else {
      return criterion.appliesTo === 'INDIVIDUAL' || criterion.appliesTo === 'BOTH';
    }
  });

  return (
    <div className="space-y-6">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300 w-1/4">
              Criteria
            </th>
            <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300 w-1/2">
              Rating Levels
            </th>
            <th className="text-center p-3 font-medium text-gray-700 dark:text-gray-300 w-1/4">
              Points
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredCriteria.map((criterion) => (
            <tr key={criterion.criterionId} className="border-b border-gray-200 dark:border-gray-700">
              <td className="p-3 align-top">
                <div className="font-medium text-gray-800 dark:text-gray-200">
                  {criterion.description}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Weight: {criterion.weight}%
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => toggleCommentSection(criterion.criterionId)}
                >
                  <i className={cn(
                    "fas mr-1",
                    expandedComments[criterion.criterionId] ? "fa-chevron-up" : "fa-chevron-down"
                  )}></i>
                  Comments
                </Button>
              </td>
              <td className="p-3">
                {/* Only show level selection for descriptive scale types */}
                {criterion.scaleType === 'descriptive' ? (
                  <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${criterion.levels.length}, minmax(0, 1fr))` }}
                  >
                    {(criterion.levels || []).map((level) => (
                      <div
                        key={level.levelId}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer transition-all text-center",
                          "hover:bg-gray-50 dark:hover:bg-gray-700",
                          selectedRatings[criterion.criterionId]?.levelId === level.levelId
                            ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400"
                            : "border-gray-300 dark:border-gray-600",
                          disabled && "cursor-not-allowed opacity-75"
                        )}
                        onClick={() => handleRatingSelect(criterion.criterionId, level.levelId, level)}
                      >
                        <div className="font-semibold text-sm mb-1 flex items-center justify-center gap-1">
                          {selectedRatings[criterion.criterionId]?.levelId === level.levelId && (
                            <i className="fas fa-check-circle text-blue-600 dark:text-blue-400"></i>
                          )}
                          <span>{getLevelLabel(level)}</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {(() => { const r = normalizeRange(level); return `${r.min}-${r.max}`; })()}
                        </div>
                        {level?.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {level.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* For points scale type, show a simple message */
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    <i className="fas fa-edit mr-2"></i>
                    Enter points directly in the Points column →
                  </div>
                )}
                
                {/* Comments Section */}
                {expandedComments[criterion.criterionId] && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Criterion-specific comment
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      value={localComments[criterion.criterionId] || ''}
                      onChange={(e) => handleCommentChange(criterion.criterionId, e.target.value)}
                      disabled={disabled}
                      placeholder="Add your comment here..."
                    />
                    
                    {/* Predefined Comments */}
                    {!disabled && predefinedComments[criterion.criterionId] && 
                     predefinedComments[criterion.criterionId][selectedRatings[criterion.criterionId]?.levelId] && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Quick Comments (click to add):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {predefinedComments[criterion.criterionId][selectedRatings[criterion.criterionId]?.levelId].map((comment) => (
                            <button
                              key={comment.id}
                              className="px-3 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 
                                       text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50
                                       transition-colors"
                              onClick={() => addPredefinedComment(criterion.criterionId, comment.text)}
                              disabled={disabled}
                            >
                              {comment.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {!disabled && (
                      <div className="mt-3 flex items-center">
                        <input
                          type="checkbox"
                          id={`save-comment-${criterion.criterionId}`}
                          className="mr-2"
                          disabled={
                            disabled ||
                            !selectedRatings[criterion.criterionId]?.levelId ||
                            !(localComments[criterion.criterionId] && localComments[criterion.criterionId].trim())
                          }
                          onChange={async (e) => {
                            if (!e.target.checked) return;
                            // Fire save to library callback if provided
                            const levelId = selectedRatings[criterion.criterionId]?.levelId;
                            const text = (localComments[criterion.criterionId] || '').trim();
                            if (onSavePredefinedComment && levelId && text) {
                              try {
                                await onSavePredefinedComment(criterion.criterionId, levelId, text);
                              } finally {
                                // uncheck after attempting save
                                e.target.checked = false;
                              }
                            } else {
                              e.target.checked = false;
                            }
                          }}
                          title={!selectedRatings[criterion.criterionId]?.levelId
                            ? 'Select a level first'
                            : !(localComments[criterion.criterionId] && localComments[criterion.criterionId].trim())
                              ? 'Enter a comment to save'
                              : 'Save this comment to the predefined library'}
                        />
                        <label 
                          htmlFor={`save-comment-${criterion.criterionId}`}
                          className="text-xs text-gray-600 dark:text-gray-400"
                        >
                          Save comment to library for reuse
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="p-3 align-top text-center">
                {selectedRatings[criterion.criterionId] || criterion.scaleType === 'points' ? (
                  <div className="space-y-2">
                    {disabled ? (
                      <div className="flex items-center justify-center space-x-1 text-sm text-gray-700 dark:text-gray-300">
                        <i className="fas fa-star text-amber-500"></i>
                        <span>{selectedRatings[criterion.criterionId]?.points || 0}</span>
                        <span className="text-xs text-gray-500">pts</span>
                      </div>
                    ) : criterion.scaleType === 'points' ? (
                      /* Points scale type: Show editable input with 0-100 range */
                      <div className="flex items-center justify-center space-x-2">
                        <input
                          type="number"
                          className="w-16 p-1 border border-gray-300 dark:border-gray-600 rounded text-center
                                   bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          value={selectedRatings[criterion.criterionId]?.points || ''}
                          onChange={(e) => handlePointsChange(criterion.criterionId, e.target.value)}
                          min={0}
                          max={100}
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">pts</span>
                      </div>
                    ) : selectedRatings[criterion.criterionId] ? (
                      /* Descriptive scale type: Show readonly calculated points */
                      <div className="flex items-center justify-center space-x-1 text-sm text-gray-700 dark:text-gray-300">
                        <i className="fas fa-calculator text-blue-500"></i>
                        <span>{selectedRatings[criterion.criterionId].points}</span>
                        <span className="text-xs text-gray-500">pts</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">-</span>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {criterion.scaleType === 'points' 
                        ? '(0-100)' 
                        : selectedRatings[criterion.criterionId]
                          ? `(${selectedRatings[criterion.criterionId].minPoints}-${selectedRatings[criterion.criterionId].maxPoints})`
                          : ''
                      }
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400 dark:text-gray-600">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Total Score Display */}
      {showTotals && (
        <div className="flex justify-end">
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Weighted Score:
              </span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {calculateWeightedScore(filteredCriteria, selectedRatings).toFixed(2)} / 100
              </span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function calculateWeightedScore(criteria, selectedRatings) {
  return criteria.reduce((total, criterion) => {
    const rating = selectedRatings[criterion.criterionId];
    if (rating && rating.points) {
      return total + (rating.points * criterion.weight / 100);
    }
    return total;
  }, 0);
}
