"use client";

import { useCallback, useMemo, useState } from "react";
import { assignmentService } from "@/services/assignmentService";
import { useNotification } from "@/hooks/useNotification.js";

const downloadBlob = (blob, filename) => {
  if (!blob) return;
  const safeName = filename || "export.csv";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export function useGradeExport(defaultAssignmentId) {
  const { showNotification } = useNotification();
  const [gradeExportType, setGradeExportType] = useState(null);
  const [isExportingGrades, setIsExportingGrades] = useState(false);
  const [isExportingTeacherDetails, setIsExportingTeacherDetails] = useState(false);

  const ensureAssignmentId = useCallback(
    (overrideId) => {
      const resolvedId = overrideId ?? defaultAssignmentId;
      if (!resolvedId) {
        showNotification("error", "Assignment id is required for export.");
        return null;
      }
      return resolvedId;
    },
    [defaultAssignmentId, showNotification]
  );

  const exportGrades = useCallback(
    async ({ assignmentId, type, label } = {}) => {
      const resolvedId = ensureAssignmentId(assignmentId);
      if (!resolvedId || isExportingGrades) {
        return;
      }

      const exportType = type || "mixed";
      setIsExportingGrades(true);
      setGradeExportType(exportType);

      try {
        const result = await assignmentService.exportAssignmentGrades(resolvedId, type);
        if (!result?.success) {
          showNotification("error", result?.message || "Failed to export grades.");
          return;
        }

        const filename =
          result.data?.filename ||
          `assignment-${resolvedId}-${exportType}.${exportType === "mixed" ? "zip" : "csv"}`;
        downloadBlob(result.data?.blob, filename);
        showNotification(
          "success",
          label
            ? `${label} export ready: ${filename}`
            : `Grades export ready: ${filename}`
        );
      } catch (error) {
        showNotification("error", error?.message || "Failed to export grades.");
      } finally {
        setIsExportingGrades(false);
        setGradeExportType(null);
      }
    },
    [ensureAssignmentId, isExportingGrades, showNotification]
  );

  const exportTeacherDetails = useCallback(
    async ({ assignmentId, label } = {}) => {
      const resolvedId = ensureAssignmentId(assignmentId);
      if (!resolvedId || isExportingTeacherDetails) {
        return;
      }

      setIsExportingTeacherDetails(true);
      try {
        const result = await assignmentService.exportTeacherScoringDetails(resolvedId);
        if (!result?.success) {
          showNotification("error", result?.message || "Failed to export teacher scoring details.");
          return;
        }

        const filename =
          result.data?.filename || `teacher-scoring-details-${resolvedId}.csv`;
        downloadBlob(result.data?.blob, filename);
        showNotification(
          "success",
          label
            ? `${label} export ready: ${filename}`
            : `Teacher scoring export ready: ${filename}`
        );
      } catch (error) {
        showNotification("error", error?.message || "Failed to export teacher scoring details.");
      } finally {
        setIsExportingTeacherDetails(false);
      }
    },
    [ensureAssignmentId, isExportingTeacherDetails, showNotification]
  );

  const state = useMemo(
    () => ({
      gradeExportType,
      isExportingGrades,
      isExportingTeacherDetails,
    }),
    [gradeExportType, isExportingGrades, isExportingTeacherDetails]
  );

  return {
    ...state,
    exportGrades,
    exportTeacherDetails,
  };
}
