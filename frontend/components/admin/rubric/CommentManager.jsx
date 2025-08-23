'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit3, Check, X, MessageSquare } from 'lucide-react';

export default function CommentManager({ comments, levels, onUpdate }) {
  const [newComment, setNewComment] = useState({ text: '', levelId: levels[0]?.id || '' });
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const handleAddComment = () => {
    if (!newComment.text.trim() || !newComment.levelId) return;

    const comment = {
      id: Date.now().toString(),
      text: newComment.text.trim(),
      levelId: newComment.levelId
    };

    onUpdate([...comments, comment]);
    setNewComment({ text: '', levelId: levels[0]?.id || '' });
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
      {/* Add New Comment */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Add Predefined Comment
        </h6>
        <div className="space-y-3">
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
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment.text}
              onChange={(e) => setNewComment({ ...newComment, text: e.target.value })}
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

      {/* Comments by Level */}
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
    </div>
  );
}