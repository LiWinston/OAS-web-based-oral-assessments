'use client';

import { useState } from 'react';
import { 
  GripVertical, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Copy, 
  Plus,
  MessageSquare,
  Star,
  CheckCircle,
  Circle,
  AlertCircle,
  Edit3,
  X
} from 'lucide-react';
import PerformanceLevel from './PerformanceLevel';
import CommentManager from './CommentManager';

export default function RubricCriterion({
  criterion,
  index,
  totalCriteria,
  onUpdate,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCommentManager, setShowCommentManager] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(criterion.title || '');

  const handleUpdateLevel = (levelIndex, updatedLevel) => {
    const newLevels = [...criterion.levels];
    newLevels[levelIndex] = updatedLevel;
    onUpdate({ ...criterion, levels: newLevels });
  };

  const handleAddLevel = () => {
    const newLevel = {
      id: Date.now().toString(),
      name: 'New Level',
      description: '',
      minPoints: 0,
      maxPoints: 0,
      color: 'gray'
    };
    onUpdate({ ...criterion, levels: [...criterion.levels, newLevel] });
  };

  const handleDeleteLevel = (levelIndex) => {
    if (criterion.levels.length === 1) return;
    const newLevels = criterion.levels.filter((_, i) => i !== levelIndex);
    onUpdate({ ...criterion, levels: newLevels });
  };

  const handleUpdateComments = (comments) => {
    onUpdate({ ...criterion, comments });
  };

  const handleTitleSave = () => {
    onUpdate({ ...criterion, title: tempTitle });
    setEditingTitle(false);
  };

  const getScaleIcon = (scale) => {
    switch (scale) {
      case 'descriptive':
        return <Star className="w-4 h-4" />;
      case 'letter':
        return <span className="text-sm font-bold">A</span>;
      case 'numeric':
        return <span className="text-sm font-bold">#</span>;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getLevelColorClasses = (color) => {
    const colorMap = {
      green: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
      blue: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
      orange: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
      red: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
      gray: 'bg-gray-100 dark:bg-gray-800/30 border-gray-300 dark:border-gray-700'
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <div
      className={`dashboard-card transition-all duration-300 ${
        isDragging ? 'opacity-50 scale-95' : 'hover:shadow-lg transform hover:-translate-y-1'
      } ${isExpanded ? 'overflow-visible' : 'overflow-hidden'}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="cursor-move p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <GripVertical className="w-5 h-5 text-gray-400" />
            </div>
            
            {editingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTitleSave()}
                  className="form-control py-1 px-2"
                  autoFocus
                />
                <button
                  onClick={handleTitleSave}
                  className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setTempTitle(criterion.title);
                    setEditingTitle(false);
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {criterion.title}
                </h4>
                <button
                  onClick={() => setEditingTitle(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm font-medium">
                  {criterion.weight}%
                </span>
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {getScaleIcon(criterion.markingScale)}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {criterion.markingScale === 'descriptive' ? 'Descriptive' : 
                     criterion.markingScale === 'letter' ? 'Letter Grade' : 'Numeric'}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            <button
              onClick={onDuplicate}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Duplicate criterion"
            >
              <Copy className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Delete criterion"
              disabled={totalCriteria === 1}
            >
              <Trash2 className={`w-5 h-5 ${
                totalCriteria === 1 ? 'text-gray-300' : 'text-red-500'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 animate-slide-down">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={criterion.description || ''}
                onChange={(e) => onUpdate({ ...criterion, description: e.target.value })}
                className="form-control"
                rows={2}
                placeholder="Describe what this criterion assesses"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Weight (%)
                </label>
                <input
                  type="number"
                  value={criterion.weight || 0}
                  onChange={(e) => onUpdate({ ...criterion, weight: parseInt(e.target.value) || 0 })}
                  className="form-control"
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scale Type
                </label>
                <select
                  value={criterion.markingScale || 'descriptive'}
                  onChange={(e) => onUpdate({ ...criterion, markingScale: e.target.value })}
                  className="form-control"
                >
                  <option value="descriptive">Descriptive</option>
                  <option value="letter">Letter Grade</option>
                  <option value="numeric">Numeric</option>
                </select>
              </div>
            </div>
          </div>

          {/* Performance Levels */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Performance Levels
              </h5>
              <button
                onClick={handleAddLevel}
                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Level
              </button>
            </div>
            
            <div className="space-y-2">
              {criterion.levels.map((level, levelIndex) => (
                <PerformanceLevel
                  key={level.id}
                  level={level}
                  index={levelIndex}
                  totalLevels={criterion.levels.length}
                  markingScale={criterion.markingScale}
                  onUpdate={(updated) => handleUpdateLevel(levelIndex, updated)}
                  onDelete={() => handleDeleteLevel(levelIndex)}
                />
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Predefined Comments
                </span>
                {criterion.comments.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                    {criterion.comments.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowCommentManager(!showCommentManager)}
                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                {showCommentManager ? 'Hide' : 'Manage'} Comments
              </button>
            </div>

            {showCommentManager && (
              <div className="mt-4">
                <CommentManager
                  comments={criterion.comments}
                  levels={criterion.levels}
                  onUpdate={handleUpdateComments}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}