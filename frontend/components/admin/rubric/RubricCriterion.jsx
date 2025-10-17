'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  Plus,
  Users,
  User,
} from 'lucide-react';
import PerformanceLevel from './PerformanceLevel';
import { preventNumberInputScroll } from '@/lib/utils';

const CRITERION_TYPE_LABELS = {
  INDIVIDUAL: 'Individual',
  GROUP: 'Group',
};

export default function RubricCriterion({
  criterion,
  index,
  totalCriteria,
  weightBasis = 'percentage',
  highlight = false,
  allowedCriterionTypes = ['INDIVIDUAL', 'GROUP'],
  onUpdate,
  onDelete,
  onDuplicate
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [justAdded, setJustAdded] = useState(highlight);

  // Auto-highlight and scroll into view when added
  const containerId = `criterion-${criterion.id}`;
  useEffect(() => {
    if (highlight) {
      setTimeout(() => {
        const el = document.getElementById(containerId);
        if (el && el.scrollIntoView) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTimeout(() => setJustAdded(false), 1500);
      }, 0);
    }
  }, [highlight, containerId]);

  const normalizedOptions = allowedCriterionTypes.map((option) => option.toUpperCase());
  const criterionTypeValue = normalizedOptions.includes((criterion.criterionType || '').toUpperCase())
    ? (criterion.criterionType || '').toUpperCase()
    : (normalizedOptions[0] || 'INDIVIDUAL');
  const criterionTypeLocked = normalizedOptions.length === 1;

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

  const handleCriterionTypeChange = (value) => {
    onUpdate({ ...criterion, criterionType: value.toUpperCase() });
  };

  return (
    <div
      id={containerId}
      className={`dashboard-card transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
        isExpanded ? 'overflow-visible' : 'overflow-hidden'
      } ${
        justAdded ? 'ring-2 ring-amber-400' : ''
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 flex-1">
            <input
              value={criterion.title || ''}
              onChange={(e) => onUpdate({ ...criterion, title: e.target.value, description: e.target.value })}
              className="w-full sm:flex-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-white bg-transparent border border-transparent focus:border-purple-500 focus:ring-0 rounded px-2 py-1"
              placeholder={`Criterion ${index + 1}`}
            />
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold">
                {criterion.weight}{weightBasis === 'percentage' ? '%' : ' pts'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded text-xs font-semibold">
                {(criterionTypeValue === 'GROUP' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />)}
                {CRITERION_TYPE_LABELS[criterionTypeValue] || criterionTypeValue}
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
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Use the performance levels below to explain expectations. The criterion name is the only label shared with examiners and students.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {weightBasis === 'percentage' ? 'Weight (%)' : 'Points'}
              </label>
              <input
                type="number"
                value={criterion.weight ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    onUpdate({ ...criterion, weight: '' });
                  } else {
                    const numValue = Number(value);
                    onUpdate({ ...criterion, weight: Number.isFinite(numValue) ? numValue : '' });
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value === '' || !Number.isFinite(Number(value))) {
                    onUpdate({ ...criterion, weight: 0 });
                  }
                }}
                onWheel={preventNumberInputScroll}
                className="form-control"
                min={0}
              />
              {weightBasis === 'points' && (
                <p className="text-xs text-gray-500 mt-1">Assign absolute points for this criterion. Total must equal the rubric's total points.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Criterion Type
              </label>
              <select
                value={criterionTypeValue}
                onChange={(e) => handleCriterionTypeChange(e.target.value)}
                className="form-control"
                disabled={criterionTypeLocked}
              >
                {normalizedOptions.map((option) => (
                  <option key={option} value={option}>
                    {CRITERION_TYPE_LABELS[option] || option}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {criterionTypeLocked
                  ? 'Assignment type locks this criterion to the available type.'
                  : 'Select whether this criterion is assessed individually or for the group.'}
              </p>
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
                  allLevels={criterion.levels} // Pass all levels for overlap validation
                />
              ))}
            </div>
            {/* Gap coverage warning */}
            {(() => {
              const levels = criterion.levels || [];
              if (levels.length < 1) return null;
              const sorted = [...levels].sort((a,b) => (a.minPoints||0) - (b.minPoints||0));
              let hasGap = false;
              for (let i=1;i<sorted.length;i++) {
                const prev = sorted[i-1];
                const curr = sorted[i];
                if ((prev.maxPoints||0) + 1 < (curr.minPoints||0)) { hasGap = true; break; }
              }
              return hasGap ? (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-300">
                  Level ranges have gaps. Adjust min/max to ensure continuous coverage.
                </div>
              ) : null;
            })()}
          </div>

        </div>
      )}
    </div>
  );
}
