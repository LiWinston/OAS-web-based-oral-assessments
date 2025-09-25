"use client";

import { useState } from "react";
import { Trash2, AlertCircle, MessageSquare, Plus, Edit3, Check, X } from "lucide-react";

export default function PerformanceLevel({
  level,
  index,
  totalLevels,
  markingScale,
  onUpdate,
  onDelete,
  allLevels, // Added: all performance levels for overlap validation
}) {
  const [validationError, setValidationError] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [duplicateError, setDuplicateError] = useState("");

  // Use a uniform light blue theme
  const colorClasses = {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700",
    text: "text-blue-800 dark:text-blue-200",
    dot: "bg-blue-400",
  };

  // Initialize comments if not exists
  const levelComments = level.comments || [];

  // Check for duplicate comments
  const checkDuplicate = (text, targetList) => {
    return targetList.some(comment => 
      (typeof comment === 'string' ? comment : comment.text).toLowerCase().trim() === text.toLowerCase().trim()
    );
  };

  // Handle adding new comment
  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const commentText = newComment.trim();
    
    // Check for duplicates in level comments
    if (checkDuplicate(commentText, levelComments)) {
      setDuplicateError('This comment already exists in this level');
      return;
    }

    setDuplicateError('');

    const comment = {
      id: Date.now().toString(),
      text: commentText
    };

    const updatedLevel = {
      ...level,
      comments: [...levelComments, comment]
    };

    onUpdate(updatedLevel);
    setNewComment('');
  };

  // Handle updating comment
  const handleUpdateComment = (commentId) => {
    const updatedComments = levelComments.map(comment =>
      comment.id === commentId ? { ...comment, text: editText } : comment
    );
    
    const updatedLevel = {
      ...level,
      comments: updatedComments
    };

    onUpdate(updatedLevel);
    setEditingCommentId(null);
    setEditText('');
  };

  // Handle deleting comment
  const handleDeleteComment = (commentId) => {
    const updatedComments = levelComments.filter(comment => comment.id !== commentId);
    
    const updatedLevel = {
      ...level,
      comments: updatedComments
    };

    onUpdate(updatedLevel);
  };


  const startEditing = (comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  // Validate whether the score range overlaps with other levels
  const validateScoreRange = (minPoints, maxPoints, currentIndex) => {
    if (!allLevels || allLevels.length <= 1) return "";
    
    if (minPoints > maxPoints) {
      return "Minimum points cannot be greater than maximum points";
    }

    for (let i = 0; i < allLevels.length; i++) {
      if (i === currentIndex) continue; // Skip current level
      
      const otherLevel = allLevels[i];
      const otherMin = otherLevel.minPoints || 0;
      const otherMax = otherLevel.maxPoints || 0;
      
      // Check for overlap
      const hasOverlap = 
        (minPoints >= otherMin && minPoints <= otherMax) || // current min within other range
        (maxPoints >= otherMin && maxPoints <= otherMax) || // current max within other range
        (minPoints <= otherMin && maxPoints >= otherMax);   // current range contains other range
      
      if (hasOverlap) {
        return `Score range ${minPoints}-${maxPoints} overlaps with ${otherMin}-${otherMax}`;
      }
    }
    
    return "";
  };

  const handlePointsUpdate = (field, value) => {
    const numValue = parseInt(value) || 0;
    const updatedLevel = { ...level, [field]: numValue };
    
    // Validate score range
    const error = validateScoreRange(
      field === 'minPoints' ? numValue : level.minPoints || 0,
      field === 'maxPoints' ? numValue : level.maxPoints || 0,
      index
    );
    
    setValidationError(error);
    
    // Update value even if error exists to provide live feedback
    onUpdate(updatedLevel);
  };

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

  return (
    <div
      className={`relative p-4 rounded-lg border-2 ${colorClasses.bg} ${colorClasses.border} transition-all hover:shadow-md transform hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Level Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colorClasses.dot}`}></div>
              <span className={`font-medium ${colorClasses.text}`}>
                Level {index + 1}
                {markingScale === "letter" && ` (${getLetterGrade(index, totalLevels)})`}
              </span>
            </div>
          </div>

          {/* Level Details */}
          <div className="grid grid-cols-1 gap-3">
            <div className="w-full">
              <textarea
                value={level.description || ''}
                onChange={(e) =>
                  onUpdate({ ...level, description: e.target.value })
                }
                className="form-control text-sm w-full resize-none"
                placeholder="Enter performance level description (e.g. Excellent, Good, etc.)"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={level.minPoints || 0}
                    onChange={(e) => handlePointsUpdate('minPoints', e.target.value)}
                    className={`form-control text-sm text-center w-full ${
                      validationError ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="Min"
                    min={0}
                  />
                </div>
                <span className="flex items-center text-gray-500 px-2">-</span>
                <div className="flex-1">
                  <input
                    type="number"
                    value={level.maxPoints || 0}
                    onChange={(e) => handlePointsUpdate('maxPoints', e.target.value)}
                    className={`form-control text-sm text-center w-full ${
                      validationError ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="Max"
                    min={0}
                  />
                </div>
              </div>
              
              {/* Validation error hint */}
              {validationError && (
                <div className="flex items-center gap-2 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <MessageSquare className="w-4 h-4" />
                {showComments ? 'Hide' : 'Manage'} Comments
                {levelComments.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    {levelComments.length}
                  </span>
                )}
              </button>
            </div>

            {showComments && (
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {/* Error Display */}
                {duplicateError && (
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700 dark:text-red-400">{duplicateError}</span>
                    </div>
                  </div>
                )}

                {/* Add New Comment */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Add Comment for this Level
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => {
                        setNewComment(e.target.value);
                        setDuplicateError('');
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                      placeholder="Enter comment text..."
                      className="form-control text-sm flex-1"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                        newComment.trim()
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>


                {/* Level Comments List */}
                {levelComments.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Level Comments ({levelComments.length})
                    </label>
                    <div className="space-y-2">
                      {levelComments.map(comment => (
                        <div
                          key={comment.id}
                          className="flex items-start gap-2 p-2 bg-white dark:bg-gray-700 rounded border"
                        >
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                          
                          {editingCommentId === comment.id ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleUpdateComment(comment.id)}
                                className="form-control text-sm flex-1"
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdateComment(comment.id)}
                                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditText('');
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                {comment.text}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => startEditing(comment)}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-1 text-red-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {levelComments.length === 0 && (
                  <div className="text-center py-4">
                    <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No comments for this level yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
          disabled={totalLevels === 1}
        >
          <Trash2
            className={`w-4 h-4 ${
              totalLevels === 1
                ? "text-gray-300"
                : "text-red-500 hover:text-red-600"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
