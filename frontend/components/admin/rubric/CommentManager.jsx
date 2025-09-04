'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit3, Check, X, MessageSquare, Library, AlertCircle } from 'lucide-react';

export default function CommentManager({ 
  comments, 
  levels, 
  onUpdate, 
  globalComments = [], 
  onGlobalCommentsUpdate,
  mode = 'criterion' // 'criterion' or 'global'
}) {
  const [newComment, setNewComment] = useState({ text: '', levelId: levels[0]?.id || '' });
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [newGlobalComment, setNewGlobalComment] = useState('');
  const [duplicateError, setDuplicateError] = useState('');
  const [viewMode, setViewMode] = useState(mode === 'global' ? 'global' : 'criterion'); // 'criterion', 'global', 'library'

  // Check for duplicate comments
  const checkDuplicate = (text, targetList) => {
    return targetList.some(comment => 
      (typeof comment === 'string' ? comment : comment.text).toLowerCase().trim() === text.toLowerCase().trim()
    );
  };

  const handleAddComment = () => {
    if (!newComment.text.trim() || (!newComment.levelId && mode !== 'global')) return;

    const commentText = newComment.text.trim();
    
    // Check for duplicates in current criterion comments
    if (checkDuplicate(commentText, comments)) {
      setDuplicateError('This comment already exists in this criterion');
      return;
    }

    // Check for duplicates in global comments
    if (checkDuplicate(commentText, globalComments)) {
      setDuplicateError('This comment already exists in the global library');
      return;
    }

    setDuplicateError('');

    const comment = {
      id: Date.now().toString(),
      text: commentText,
      levelId: newComment.levelId
    };

    onUpdate([...comments, comment]);
    setNewComment({ text: '', levelId: levels[0]?.id || '' });
  };

  const handleAddGlobalComment = () => {
    if (!newGlobalComment.trim()) return;

    const commentText = newGlobalComment.trim();
    
    // Check for duplicates in global comments
    if (checkDuplicate(commentText, globalComments)) {
      setDuplicateError('This comment already exists in the global library');
      return;
    }

    setDuplicateError('');

    if (onGlobalCommentsUpdate) {
      onGlobalCommentsUpdate([...globalComments, commentText]);
    }
    setNewGlobalComment('');
  };

  const handleDeleteGlobalComment = (index) => {
    if (onGlobalCommentsUpdate) {
      const updatedComments = globalComments.filter((_, i) => i !== index);
      onGlobalCommentsUpdate(updatedComments);
    }
  };

  const handleImportFromGlobal = (globalComment) => {
    if (!newComment.levelId && mode !== 'global') return;

    // Check if already exists in current criterion
    if (checkDuplicate(globalComment, comments)) {
      setDuplicateError('This comment already exists in this criterion');
      return;
    }

    setDuplicateError('');

    const comment = {
      id: Date.now().toString(),
      text: globalComment,
      levelId: newComment.levelId || levels[0]?.id
    };

    onUpdate([...comments, comment]);
  };

  const handleUpdateComment = (id) => {
    const updated = comments.map(comment =>
      comment.id === id ? { ...comment, text: editText } : comment
    );
    onUpdate(updated);
    setEditingId(null);
    setEditText('');
  };

  const handleDeleteComment = (id) => {
    onUpdate(comments.filter(comment => comment.id !== id));
  };

  const startEditing = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const getLevelName = (levelId) => {
    const level = levels.find(l => l.id === levelId);
    return level?.name || 'Unknown';
  };

  const getLevelColor = (levelId) => {
    const level = levels.find(l => l.id === levelId);
    const colorMap = {
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-200'
    };
    return colorMap[level?.color] || colorMap.gray;
  };

  const groupedComments = levels.reduce((acc, level) => {
    acc[level.id] = comments.filter(comment => comment.levelId === level.id);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      {mode === 'criterion' && onGlobalCommentsUpdate && (
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setViewMode('criterion')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'criterion'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline-block mr-2" />
            Criterion Comments
          </button>
          <button
            onClick={() => setViewMode('library')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'library'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Library className="w-4 h-4 inline-block mr-2" />
            Global Library ({globalComments.length})
          </button>
        </div>
      )}

      {/* Error Display */}
      {duplicateError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700 dark:text-red-400">{duplicateError}</span>
          </div>
        </div>
      )}

      {/* Global Library View */}
      {viewMode === 'library' && (
        <>
          {/* Add Global Comment */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Add to Global Comment Library
            </h6>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGlobalComment}
                onChange={(e) => {
                  setNewGlobalComment(e.target.value);
                  setDuplicateError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleAddGlobalComment()}
                placeholder="Enter comment for global library..."
                className="form-control text-sm flex-1"
              />
              <button
                onClick={handleAddGlobalComment}
                disabled={!newGlobalComment.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  newGlobalComment.trim()
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Global Comments List */}
          <div className="space-y-2">
            <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Global Comment Library ({globalComments.length} comments)
            </h6>
            {globalComments.length > 0 ? (
              <div className="space-y-2">
                {globalComments.map((comment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <Library className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      {comment}
                    </span>
                    {mode === 'criterion' && (
                      <button
                        onClick={() => handleImportFromGlobal(comment)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                        title="Import to current criterion"
                      >
                        Import
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteGlobalComment(index)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Delete from global library"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Library className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No global comments yet. Add comments above to build a reusable library.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Criterion Comments View */}
      {viewMode === 'criterion' && (
        <>
          {/* Add New Comment */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Add Predefined Comment
            </h6>
            <div className="space-y-3">
              {levels.length > 0 && (
                <select
                  value={newComment.levelId}
                  onChange={(e) => setNewComment({ ...newComment, levelId: e.target.value })}
                  className="form-control text-sm"
                >
                  {levels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment.text}
                  onChange={(e) => {
                    setNewComment({ ...newComment, text: e.target.value });
                    setDuplicateError('');
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Enter comment text..."
                  className="form-control text-sm flex-1"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.text.trim()}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    newComment.text.trim()
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Comments by Level - Only show in criterion mode */}
      {viewMode === 'criterion' && (
        <>
          <div className="space-y-4">
            {levels.map(level => {
              const levelComments = groupedComments[level.id] || [];
              if (levelComments.length === 0) return null;

              return (
                <div key={level.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(level.id)}`}>
                      {level.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {levelComments.length} comment{levelComments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-2 pl-4">
                    {levelComments.map(comment => (
                      <div
                        key={comment.id}
                        className="flex items-start gap-2 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-shadow"
                      >
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                        
                        {editingId === comment.id ? (
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
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditText('');
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                              {comment.text}
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditing(comment)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {comments.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No predefined comments yet. Add comments above to help examiners provide consistent feedback.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}