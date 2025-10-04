'use client';

import { useState, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
import { assignmentService } from '../../../services/assignmentService';

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
  showTotals = true,
  assignmentId = null
}) {
  const [expandedComments, setExpandedComments] = useState({});
  const [localComments, setLocalComments] = useState(comments);
  const [assignmentData, setAssignmentData] = useState(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  // Function to fetch latest assignment data from API
  const fetchAssignmentData = async () => {
    if (!assignmentId || loadingAssignment) return;
    
    try {
      setLoadingAssignment(true);
      const response = await assignmentService.getAssignmentById(assignmentId);
      if (response?.success && response?.data) {
        setAssignmentData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch assignment data:', error);
    } finally {
      setLoadingAssignment(false);
    }
  };

  const normalizeRange = (level) => {
    // Support either min/max on level or a nested levelRange
    const min = level?.minPoints ?? level?.levelRange?.min ?? 0;
    const max = level?.maxPoints ?? level?.levelRange?.max ?? min;
    return { min, max };
  };

  const getLevelLabel = (level) => {
    return level?.levelLabel || level?.label || level?.description || (level?.levelId ? level.levelId.replace('L', 'Level ') : '');
  };

  const handleRatingSelect = async (criterionId, levelId, level) => {
    if (disabled) return;
    const { min, max } = normalizeRange(level);
    const midPoint = Math.floor((min + max) / 2);
    
    // Unified logic: both points and descriptive use the same approach
    onRatingChange(criterionId, {
      levelId,
      points: midPoint,
      minPoints: min,
      maxPoints: max
    });

    // Predefined comments are now embedded in sessionContext criteria via service mapping
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

  // New function that handles points change with automatic level selection
  const handlePointsChangeWithLevelSelection = async (criterionId, points, criterion) => {
    if (disabled) return;
    
    const pointsValue = parseInt(points) || 0;
    
    // Find the appropriate level based on the points value
    const levels = criterion.levels || criterion.performanceLevel || [];
    const matchingLevel = levels.find(level => {
      const range = normalizeRange(level);
      return pointsValue >= range.min && pointsValue <= range.max;
    });

    if (matchingLevel) {
      const levelId = matchingLevel.levelId || `L${levels.indexOf(matchingLevel) + 1}`;
      const range = normalizeRange(matchingLevel);
      
      // Unified logic: both points and descriptive use the same approach
      onRatingChange(criterionId, {
        levelId,
        points: pointsValue,
        minPoints: range.min,
        maxPoints: range.max
      });

      // Predefined comments are now embedded in sessionContext criteria via service mapping
    } else {
      // If no matching level found, still update points but clear level selection
      const current = selectedRatings[criterionId];
      onRatingChange(criterionId, {
        ...current,
        points: pointsValue,
        levelId: null // Clear level selection if points don't match any range
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
    // Replace the entire comment instead of appending
    handleCommentChange(criterionId, commentText);
  };

  // Extract predefined comments for current selected level from latest API data
  const getPredefinedCommentsForLevel = (criterionId) => {
    const selectedLevelId = selectedRatings[criterionId]?.levelId;
    if (!selectedLevelId) return [];

    // Prefer comments embedded in criteria.performanceLevel
    const criterion = criteria.find(c => c.criterionId === criterionId);
    if (!criterion) return [];
    const levels = criterion.levels || criterion.performanceLevel || [];
    const levelIndex = levels.findIndex(level => {
      const levelIdToMatch = level.levelId || `L${levels.indexOf(level) + 1}`;
      return levelIdToMatch === selectedLevelId;
    });
    if (levelIndex >= 0 && criterion.performanceLevel && criterion.performanceLevel[levelIndex]?.preDefinedComment) {
      const fromCriterion = criterion.performanceLevel[levelIndex].preDefinedComment;
      return Array.isArray(fromCriterion) ? fromCriterion : [];
    }

    // Fallback to assignment fetch if not present (rare)
    if (!assignmentId) return [];
    if (!assignmentData) {
      // non-blocking: best effort fetch once
      fetchAssignmentData();
      return [];
    }
    const apiCriterion = assignmentData.rubricsInfo?.find(c => c.description === criterion.description);
    if (!apiCriterion || !apiCriterion.performanceLevel) return [];
    const apiPerformanceLevel = apiCriterion.performanceLevel[levelIndex];
    const comments = apiPerformanceLevel?.preDefinedComment;
    return Array.isArray(comments) ? comments : [];
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
                {/* Show level selection for all scale types */}
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${(criterion.levels || criterion.performanceLevel || []).length}, minmax(0, 1fr))` }}
                >
                  {((criterion.levels || criterion.performanceLevel || [])).map((level, levelIndex) => {
                    const levelId = level.levelId || `L${levelIndex + 1}`;
                    const isSelected = selectedRatings[criterion.criterionId]?.levelId === levelId;
                    return (
                      <div
                        key={levelId}
                        className={cn(
                          "p-2 border rounded-lg cursor-pointer transition-all text-center min-h-[80px] flex flex-col justify-center",
                          "hover:bg-gray-50 dark:hover:bg-gray-700",
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400"
                            : "border-gray-300 dark:border-gray-600",
                          disabled && "cursor-not-allowed opacity-75"
                        )}
                        onClick={() => !disabled && handleRatingSelect(criterion.criterionId, levelId, level)}
                      >
                        <div className="font-semibold text-xs mb-1 flex items-center justify-center gap-1 leading-tight">
                          {isSelected && (
                            <i className="fas fa-check-circle text-blue-600 dark:text-blue-400 text-xs"></i>
                          )}
                          <span className="break-words text-center">{getLevelLabel(level)}</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {(() => { const r = normalizeRange(level); return `${r.min}-${r.max}`; })()}
                        </div>
                        {level?.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 break-words leading-tight">
                            {level.description}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Comments Section */}
                {expandedComments[criterion.criterionId] && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Criterion-specific comment
                    </label>
                    
                    {/* Predefined Comments Dropdown - Always show when a level is selected */}
                    {!disabled && selectedRatings[criterion.criterionId]?.levelId && (
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Select a predefined comment:
                        </label>
                        {(() => {
                          const predefinedCommentsForLevel = getPredefinedCommentsForLevel(criterion.criterionId);
                          return (
                            <select
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
                                       focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              onChange={(e) => {
                                if (e.target.value) {
                                  addPredefinedComment(criterion.criterionId, e.target.value);
                                  e.target.value = ''; // Reset selection
                                }
                              }}
                              disabled={disabled}
                            >
                              <option value="">
                                {predefinedCommentsForLevel.length > 0 
                                  ? "Choose a predefined comment..." 
                                  : "No predefined comments for this level"
                                }
                              </option>
                              {predefinedCommentsForLevel.map((comment, index) => (
                                <option key={index} value={comment}>
                                  {comment.length > 50 ? `${comment.substring(0, 50)}...` : comment}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </div>
                    )}
                    
                    <textarea
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      value={localComments[criterion.criterionId] || ''}
                      onChange={(e) => handleCommentChange(criterion.criterionId, e.target.value)}
                      disabled={disabled || !(selectedRatings[criterion.criterionId])}
                      placeholder={"Add your comment here..."}
                    />
                    
                    {!disabled && false && ( // Temporarily disabled save comment feature
                      <div className="mt-3 flex items-center">
                        <input
                          type="checkbox"
                          id={`save-comment-${criterion.criterionId}`}
                          className="mr-2"
                          disabled={true} // Always disabled for now
                          onChange={async (e) => {
                            if (!e.target.checked) return;
                            // Fire save to library callback if provided
                            const levelId = selectedRatings[criterion.criterionId]?.levelId;
                            const text = (localComments[criterion.criterionId] || '').trim();
                            if (onSavePredefinedComment && levelId && text) {
                              try {
                                // Find the performance level description for the selected level
                                const performanceLevel = criterion.performanceLevel?.find(level => {
                                  const levelIdToMatch = level.levelId || `L${criterion.performanceLevel.indexOf(level) + 1}`;
                                  return levelIdToMatch === levelId;
                                });
                                
                                if (performanceLevel) {
                                  await onSavePredefinedComment(
                                    criterion.description, 
                                    performanceLevel.description, 
                                    text
                                  );
                                }
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
                <div className="space-y-2">
                  {disabled ? (
                    <div className="flex items-center justify-center space-x-1 text-sm text-gray-700 dark:text-gray-300">
                      <i className="fas fa-star text-amber-500"></i>
                      <span>{selectedRatings[criterion.criterionId]?.points || 0}</span>
                      <span className="text-xs text-gray-500">pts</span>
                    </div>
                  ) : (
                    /* All scale types: Show editable input */
                    <div className="flex items-center justify-center space-x-2">
                      <input
                        type="number"
                        className="w-16 p-1 border border-gray-300 dark:border-gray-600 rounded text-center
                                 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        value={selectedRatings[criterion.criterionId]?.points || ''}
                        onChange={(e) => handlePointsChangeWithLevelSelection(criterion.criterionId, e.target.value, criterion)}
                        min={0}
                        max={100}
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">pts</span>
                    </div>
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
