"use client";

import { useState } from "react";
import { Trash2, AlertCircle } from "lucide-react";

export default function PerformanceLevel({
  level,
  index,
  totalLevels,
  markingScale,
  onUpdate,
  onDelete,
  allLevels, // 新增：所有的performance levels，用于验证重合
}) {
  const [validationError, setValidationError] = useState("");

  // 统一使用浅蓝色
  const colorClasses = {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700",
    text: "text-blue-800 dark:text-blue-200",
    dot: "bg-blue-400",
  };

  // 验证分数段是否与其他levels重合
  const validateScoreRange = (minPoints, maxPoints, currentIndex) => {
    if (!allLevels || allLevels.length <= 1) return "";
    
    if (minPoints > maxPoints) {
      return "Minimum points cannot be greater than maximum points";
    }

    for (let i = 0; i < allLevels.length; i++) {
      if (i === currentIndex) continue; // 跳过当前level
      
      const otherLevel = allLevels[i];
      const otherMin = otherLevel.minPoints || 0;
      const otherMax = otherLevel.maxPoints || 0;
      
      // 检查是否有重合
      const hasOverlap = 
        (minPoints >= otherMin && minPoints <= otherMax) || // 当前最小值在其他范围内
        (maxPoints >= otherMin && maxPoints <= otherMax) || // 当前最大值在其他范围内
        (minPoints <= otherMin && maxPoints >= otherMax);   // 当前范围包含其他范围
      
      if (hasOverlap) {
        return `Score range ${minPoints}-${maxPoints} overlaps with ${otherMin}-${otherMax}`;
      }
    }
    
    return "";
  };

  const handlePointsUpdate = (field, value) => {
    const numValue = parseInt(value) || 0;
    const updatedLevel = { ...level, [field]: numValue };
    
    // 验证分数段
    const error = validateScoreRange(
      field === 'minPoints' ? numValue : level.minPoints || 0,
      field === 'maxPoints' ? numValue : level.maxPoints || 0,
      index
    );
    
    setValidationError(error);
    
    // 即使有错误也更新值，让用户看到实时反馈
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
              
              {/* 验证错误提示 */}
              {validationError && (
                <div className="flex items-center gap-2 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>
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
