'use client';

import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Copy, 
  Plus,
  MessageSquare,
  Star,
  Circle
} from 'lucide-react';
import PerformanceLevel from './PerformanceLevel';

export default function RubricCriterion({
  criterion,
  index,
  totalCriteria,
  onUpdate,
  onDelete,
  onDuplicate
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleUpdateLevel = (levelIndex, updatedLevel) => {
    const newLevels = [...criterion.levels];
    newLevels[levelIndex] = updatedLevel;
    onUpdate({ ...criterion, levels: newLevels });
  };

  const handleAddLevel = () => {
    const newLevel = {
      id: Date.now().toString(),
      description: 'New Level',
      minPoints: 0,
      maxPoints: 0,
      color: 'blue'
    };
    onUpdate({ ...criterion, levels: [...criterion.levels, newLevel] });
  };

  const handleDeleteLevel = (levelIndex) => {
    if (criterion.levels.length === 1) return;
    const newLevels = criterion.levels.filter((_, i) => i !== levelIndex);
    onUpdate({ ...criterion, levels: newLevels });
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



  return (
    <div
      className={`dashboard-card transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
        isExpanded ? 'overflow-visible' : 'overflow-hidden'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {criterion.title}
            </h4>
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
                  allLevels={criterion.levels} // 传递所有levels用于重合验证
                />
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}