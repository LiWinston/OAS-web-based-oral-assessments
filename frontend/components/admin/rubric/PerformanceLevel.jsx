"use client";

import { useState } from "react";
import { Trash2, Check, X, Palette } from "lucide-react";

export default function PerformanceLevel({
  level,
  index,
  totalLevels,
  markingScale,
  onUpdate,
  onDelete,
}) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(level.name);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = ["green", "blue", "yellow", "orange", "red", "gray"];

  const colorClasses = {
    green: {
      bg: "bg-green-100 dark:bg-green-900/30",
      border: "border-green-300 dark:border-green-700",
      text: "text-green-800 dark:text-green-200",
      dot: "bg-green-500",
    },
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      border: "border-blue-300 dark:border-blue-700",
      text: "text-blue-800 dark:text-blue-200",
      dot: "bg-blue-500",
    },
    yellow: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      border: "border-yellow-300 dark:border-yellow-700",
      text: "text-yellow-800 dark:text-yellow-200",
      dot: "bg-yellow-500",
    },
    orange: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      border: "border-orange-300 dark:border-orange-700",
      text: "text-orange-800 dark:text-orange-200",
      dot: "bg-orange-500",
    },
    red: {
      bg: "bg-red-100 dark:bg-red-900/30",
      border: "border-red-300 dark:border-red-700",
      text: "text-red-800 dark:text-red-200",
      dot: "bg-red-500",
    },
    gray: {
      bg: "bg-gray-100 dark:bg-gray-800/30",
      border: "border-gray-300 dark:border-gray-700",
      text: "text-gray-800 dark:text-gray-200",
      dot: "bg-gray-500",
    },
  };

  const currentColor = colorClasses[level.color] || colorClasses.gray;

  const handleNameSave = () => {
    onUpdate({ ...level, name: tempName });
    setEditingName(false);
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
      className={`relative p-4 rounded-lg border-2 ${currentColor.bg} ${currentColor.border} transition-all hover:shadow-md transform hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Level Header */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-3 h-3 rounded-full ${currentColor.dot} animate-pulse-slow`}
              ></div>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="absolute -top-1 -right-1 p-0.5 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow-md transition-shadow"
              >
                <Palette className="w-3 h-3 text-gray-500" />
              </button>

              {/* Color Picker Dropdown */}
              {showColorPicker && (
                <div className="absolute top-6 left-0 z-10 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          onUpdate({ ...level, color });
                          setShowColorPicker(false);
                        }}
                        className={`w-6 h-6 rounded-full ${colorClasses[color].dot} hover:scale-110 transition-transform`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {editingName ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleNameSave()}
                  className="form-control py-1 px-2 text-sm"
                  autoFocus
                />
                <button
                  onClick={handleNameSave}
                  className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setTempName(level.name);
                    setEditingName(false);
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className={`font-medium ${currentColor.text} hover:underline`}
              >
                {markingScale === "letter"
                  ? getLetterGrade(index, totalLevels) + " - "
                  : ""}
                {level.name}
              </button>
            )}
          </div>

          {/* Level Details */}
          <div className="grid grid-cols-1 gap-3">
            <div className="w-full">
              <textarea
                value={level.description}
                onChange={(e) =>
                  onUpdate({ ...level, description: e.target.value })
                }
                className="form-control text-sm w-full resize-none"
                placeholder="Level description"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={level.minPoints}
                  onChange={(e) =>
                    onUpdate({
                      ...level,
                      minPoints: parseInt(e.target.value) || 0,
                    })
                  }
                  className="form-control text-sm text-center w-full"
                  placeholder="Min"
                  min={0}
                />
              </div>
              <span className="flex items-center text-gray-500 px-2">-</span>
              <div className="flex-1">
                <input
                  type="number"
                  value={level.maxPoints}
                  onChange={(e) =>
                    onUpdate({
                      ...level,
                      maxPoints: parseInt(e.target.value) || 0,
                    })
                  }
                  className="form-control text-sm text-center w-full"
                  placeholder="Max"
                  min={0}
                />
              </div>
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
