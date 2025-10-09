"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../ui/button";
import { useNotification } from "../../../hooks/useNotification";
import { assignmentService } from "../../../services/assignmentService";

function formatDateTimeForInput(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getDefaultDateRange() {
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    0,
    0
  );

  return {
    start: formatDateTimeForInput(startOfDay),
    end: formatDateTimeForInput(endOfDay),
  };
}

export function AssignmentCreationModal({
  isOpen,
  onClose,
  onAssignmentCreated,
  courseId,
  courseName = "Software Project Management",
  courseCode = "COMP90082",
  courseSemester = "2025 Semester 2",
  // API functions passed from parent
  createAssignment,
  previewStudentCsv,
  previewExaminerCsv,
  uploadStudentCsv,
  uploadExaminerCsv,
  uploadGroupCsv,
  existingAssignments = [],
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const { start, end } = getDefaultDateRange();
    return {
      courseId,
      name: "",
      description: "",
      type: "individual",
      startDate: start,
      endDate: end,
      weight: 25,
    };
  });

  // CSV upload data - independent structure
  const [csvData, setCsvData] = useState({
    student: {
      file: null,
      type: "student",
      previewData: null,
    },
    examiner: {
      file: null,
      previewData: null,
    },
    group: {
      file: null,
      previewData: null,
    },
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdAssignment, setCreatedAssignment] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [csvUploadStatus, setCsvUploadStatus] = useState({
    student: { uploading: false, error: null },
    examiner: { uploading: false, error: null },
    group: { uploading: false, error: null },
  });
  const [courseWeightTotal, setCourseWeightTotal] = useState({
    loading: false,
    value: null,
    error: null,
  });
  const [csvHistoryState, setCsvHistoryState] = useState({
    student: { loading: false, error: null, items: [] },
    examiner: { loading: false, error: null, items: [] },
    group: { loading: false, error: null, items: [] },
  });
  const [csvHistorySelection, setCsvHistorySelection] = useState({
    student: "",
    examiner: "",
    group: "",
  });
  const fileInputRef = useRef(null);
  const contentRef = useRef(null);
  const { showNotification } = useNotification();
  const router = useRouter();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const { start, end } = getDefaultDateRange();
      setStep(1);
      setFormData({
        courseId,
        name: "",
        description: "",
        type: "individual",
        startDate: start,
        endDate: end,
        weight: 25,
      });
      setCsvData({
        student: { file: null, type: "student", previewData: null },
        examiner: { file: null, previewData: null },
        group: { file: null, previewData: null },
      });
      setCsvUploadStatus({
        student: { uploading: false, error: null },
        examiner: { uploading: false, error: null },
        group: { uploading: false, error: null },
      });
      setCsvHistorySelection({ student: "", examiner: "", group: "" });
      setCsvHistoryState({
        student: { loading: true, error: null, items: [] },
        examiner: { loading: true, error: null, items: [] },
        group: { loading: true, error: null, items: [] },
      });
      setValidationErrors({});
      setShowSuccess(false);
      setCreatedAssignment(null);
      // Fetch course stats for weight total
      (async () => {
        try {
          setCourseWeightTotal({ loading: true, value: null, error: null });
          const res = await assignmentService.getAssignmentStats(courseId);
          if (res?.success && res?.data) {
            // Support both shapes: {data: { totalWeight }} or direct values
            const total =
              res.data.totalWeight ??
              res.data.total_weight ??
              res.data.total ??
              0;
            setCourseWeightTotal({ loading: false, value: total, error: null });
          } else {
            setCourseWeightTotal({
              loading: false,
              value: null,
              error: res?.message || "Failed to load course stats",
            });
          }
        } catch (e) {
          setCourseWeightTotal({
            loading: false,
            value: null,
            error: "Failed to load course stats",
          });
        }
      })();
    }
  }, [isOpen, courseId]);

  // Update CSV type when assignment type changes
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const assignmentIds = (existingAssignments || [])
      .map((item) => Number(item?.id))
      .filter((id) => Number.isFinite(id));

    if (!assignmentIds.length) {
      setCsvHistoryState((prev) => ({
        student: { ...prev.student, loading: false, items: [] },
        examiner: { ...prev.examiner, loading: false, items: [] },
        group: { ...prev.group, loading: false, items: [] },
      }));
      return;
    }

    const assignmentIdSet = new Set(assignmentIds);
    const loadHistoryForType = async (type) => {
      setCsvHistoryState((prev) => ({
        ...prev,
        [type]: { ...prev[type], loading: true, error: null },
      }));

      try {
        const typeFilters =
          type === "group" ? ["group", "mix"] : [type];

        const requests = assignmentIds.flatMap((assignmentId) =>
          typeFilters.map((importType) =>
            assignmentService.fetchCsvHistory({
              assignmentId,
              importType,
              pageNum: 1,
              pageSize: 10,
            })
          )
        );

        const responses = await Promise.all(requests);

        const items = [];
        const errors = [];

        responses.forEach((result) => {
          if (result?.success) {
            const payload =
              result.data?.items ?? result.data?.data?.items ?? result.data ?? [];
            if (Array.isArray(payload)) {
              payload.forEach((item) => {
                if (assignmentIdSet.has(Number(item.assignmentId))) {
                  items.push(item);
                }
              });
            }
          } else if (result) {
            errors.push(result.message || "Failed to fetch CSV history");
          }
        });

        // Deduplicate by history id
        const seen = new Set();
        const deduped = items.filter((item) => {
          const key = item.id;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });

        setCsvHistoryState((prev) => ({
          ...prev,
          [type]: {
            loading: false,
            error: errors.length ? errors[0] : null,
            items: deduped,
          },
        }));
      } catch (error) {
        setCsvHistoryState((prev) => ({
          ...prev,
          [type]: {
            loading: false,
            error: error?.message || "Failed to fetch CSV history",
            items: [],
          },
        }));
      }
    };

    ["student", "examiner", "group"].forEach((type) => {
      loadHistoryForType(type);
    });
  }, [isOpen, existingAssignments]);

  // Ensure modal scrolls to top when changing steps
  useEffect(() => {
    if (contentRef.current) {
      try {
        contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        // Fallback for environments without smooth scroll support
        contentRef.current.scrollTop = 0;
      }
    }
  }, [step]);

  // When opening the modal, make sure content is at the top
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // Calculate step completion
  const getStepCompletion = () => {
    const completion = {
      1: false,
      2: false,
      3: false,
    };

    // Simple logic: current step and all previous steps are complete
    for (let i = 1; i <= 3; i++) {
      completion[i] = step > i;
    }

    return completion;
  };

  // Validate current step
  const validateStep = (stepNumber) => {
    const errors = {};
    const requiresGroupCsv = formData.type === "group";

    switch (stepNumber) {
      case 1:
        if (!formData.name.trim()) {
          errors.name = "Assignment name is required";
        }
        if (!formData.startDate) {
          errors.startDate = "Start date is required";
        }
        if (!formData.endDate) {
          errors.endDate = "End date is required";
        }
        if (
          formData.startDate &&
          formData.endDate &&
          new Date(formData.startDate) > new Date(formData.endDate)
        ) {
          errors.endDate = "End date must be after start date";
        }
        if (!formData.weight || formData.weight === "") {
          errors.weight = "Weight is required";
        } else if (formData.weight < 0 || formData.weight > 100) {
          errors.weight = "Weight must be between 0 and 100";
        }
        break;
      case 2:
        // Require both CSV previews to be successful
        if (!csvData.student.previewData) {
          errors.studentCsv =
            "Please upload and validate the Student CSV before continuing";
        }
        if (!csvData.examiner.previewData) {
          errors.examinerCsv =
            "Please upload and validate the Examiner CSV before continuing";
        }
        if (requiresGroupCsv && !csvData.group.previewData) {
          errors.groupCsv =
            "Please upload and validate the Group CSV for group assignments";
        }
        break;
      case 3:
        // Final validation done on submit
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Quick readiness checks for disabling Next button
  const isStep1Ready = () => {
    if (!formData.name?.trim()) return false;
    if (!formData.startDate || !formData.endDate) return false;
    if (new Date(formData.startDate) > new Date(formData.endDate)) return false;
    if (formData.weight === "" || formData.weight == null) return false;
    const w = Number(formData.weight);
    if (Number.isNaN(w)) return false;
    return w >= 0 && w <= 100;
  };

  const isStep2Ready = () => {
    const requiresGroupCsv = formData.type === "group";
    return (
      Boolean(csvData.student.previewData) &&
      Boolean(csvData.examiner.previewData) &&
      (!requiresGroupCsv || Boolean(csvData.group.previewData))
    );
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Handle file select
  const handleFileSelect = async (file) => {
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      showNotification("error", "Please upload a CSV file");
      return;
    }

    setCsvData((prev) => ({
      ...prev,
      student: { ...prev.student, file: file },
    }));

    setCsvUploadStatus((prev) => ({
      ...prev,
      student: { uploading: false, error: null },
    }));
  };

  const handleGroupFileSelect = async (file) => {
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      showNotification("error", "Please upload a CSV file");
      return;
    }

    setCsvData((prev) => ({
      ...prev,
      group: { ...prev.group, file },
    }));

    setCsvUploadStatus((prev) => ({
      ...prev,
      group: { uploading: false, error: null },
    }));
  };

  // Handle examiner file select
  const handleExaminerFileSelect = async (file) => {
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      showNotification("error", "Please upload a CSV file");
      return;
    }

    setCsvData((prev) => ({
      ...prev,
      examiner: { ...prev.examiner, file: file },
    }));

    setCsvUploadStatus((prev) => ({
      ...prev,
      examiner: { uploading: false, error: null },
    }));
  };

  const handleHistorySelection = async (type, historyId) => {
    setCsvHistorySelection((prev) => ({
      ...prev,
      [type]: historyId,
    }));

    if (!historyId) {
      return;
    }

    const historyItems = csvHistoryState[type]?.items || [];
    const historyEntry = historyItems.find(
      (item) => String(item.id) === String(historyId)
    );

    if (!historyEntry) {
      return;
    }

    setCsvUploadStatus((prev) => ({
      ...prev,
      [type]: { uploading: true, error: null },
    }));

    try {
      const download = await assignmentService.downloadCsvHistoryFile(
        historyEntry.id
      );

      if (!download.success || !download.data?.blob) {
        throw new Error(download.message || "Failed to download CSV");
      }

      const blob = download.data.blob;
      const filename =
        download.data.filename ||
        historyEntry.originalFilename ||
        `${type}_roster.csv`;
      const file = new File([blob], filename, {
        type: blob.type || "text/csv",
      });

      let previewResult;
      if (type === "examiner") {
        setCsvData((prev) => ({
          ...prev,
          examiner: { ...prev.examiner, file, previewData: null },
        }));
        previewResult = await previewStudentCsv(file, "examiner");
      } else if (type === "group") {
        setCsvData((prev) => ({
          ...prev,
          group: { ...prev.group, file, previewData: null },
        }));
        previewResult = await previewStudentCsv(file, "group");
      } else {
        const importType =
          historyEntry.importType?.toLowerCase() === "group" ? "group" : "student";
        setCsvData((prev) => ({
          ...prev,
          student: {
            ...prev.student,
            file,
            type: importType,
            previewData: null,
          },
        }));
        previewResult = await previewStudentCsv(file, importType);
      }

      if (!previewResult.success) {
        throw new Error(previewResult.message || "Failed to preview CSV");
      }

      setCsvData((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          previewData: previewResult.data,
          file,
        },
      }));

      setCsvUploadStatus((prev) => ({
        ...prev,
        [type]: { uploading: false, error: null },
      }));

      showNotification("success", "CSV loaded from history");
    } catch (error) {
      setCsvUploadStatus((prev) => ({
        ...prev,
        [type]: {
          uploading: false,
          error: error?.message || "Failed to load CSV",
        },
      }));
      showNotification("error", error?.message || "Failed to load CSV");
    }
  };

  // Handle CSV upload
  const handleCsvPreview = async (type) => {
    if (type === "student") {
      if (!csvData.student.file) {
        showNotification("error", "Please select a CSV file first");
        return;
      }

      setCsvUploadStatus((prev) => ({
        ...prev,
        student: { ...prev.student, uploading: true, error: null },
      }));

      try {
        // Use parent's preview function with simplified parameters
        const result = await previewStudentCsv(
          csvData.student.file,
          "student"
        );

        setCsvUploadStatus((prev) => ({
          ...prev,
          student: { ...prev.student, uploading: false, error: null },
        }));

        // Store preview data
        setCsvData((prev) => ({
          ...prev,
          student: { ...prev.student, previewData: result.data },
        }));

        showNotification("success", "CSV file validated successfully");
      } catch (error) {
        console.error("CSV upload error:", error);

        // Detect format errors
        const isFormatError =
          error.code === "2002" ||
          error.data === "CSV header does not match expected format" ||
          error.data === "CSV read failed";

        const errorMessage = isFormatError ? "Error Format" : error.message;

        setCsvUploadStatus((prev) => ({
          ...prev,
          student: { ...prev.student, uploading: false, error: errorMessage },
        }));
      }
    } else if (type === "examiner") {
      if (!csvData.examiner.file) {
        showNotification("error", "Please select a CSV file first");
        return;
      }

      setCsvUploadStatus((prev) => ({
        ...prev,
        examiner: { ...prev.examiner, uploading: true, error: null },
      }));

      try {
        // Use parent's preview function with simplified parameters (same as student but with type 'examiner')
        const result = await previewStudentCsv(
          csvData.examiner.file,
          "examiner"
        );

        setCsvUploadStatus((prev) => ({
          ...prev,
          examiner: { ...prev.examiner, uploading: false, error: null },
        }));

        // Store preview data
        setCsvData((prev) => ({
          ...prev,
          examiner: { ...prev.examiner, previewData: result.data },
        }));

        showNotification("success", "Examiner CSV file validated successfully");
      } catch (error) {
        console.error("Examiner CSV upload error:", error);

        // Detect format errors
        const isFormatError =
          error.code === "2002" ||
          error.data === "CSV header does not match expected format" ||
          error.data === "CSV read failed";

        const errorMessage = isFormatError ? "Error Format" : error.message;

        setCsvUploadStatus((prev) => ({
          ...prev,
          examiner: { ...prev.examiner, uploading: false, error: errorMessage },
        }));
      }
    } else if (type === "group") {
      if (!csvData.group.file) {
        showNotification("error", "Please select a CSV file first");
        return;
      }

      setCsvUploadStatus((prev) => ({
        ...prev,
        group: { ...prev.group, uploading: true, error: null },
      }));

      try {
        const result = await previewStudentCsv(csvData.group.file, "group");

        setCsvUploadStatus((prev) => ({
          ...prev,
          group: { ...prev.group, uploading: false, error: null },
        }));

        setCsvData((prev) => ({
          ...prev,
          group: { ...prev.group, previewData: result.data },
        }));

        showNotification("success", "Group CSV file validated successfully");
      } catch (error) {
        console.error("Group CSV upload error:", error);

        const isFormatError =
          error.code === "2002" ||
          error.data === "CSV header does not match expected format" ||
          error.data === "CSV read failed";

        const errorMessage = isFormatError ? "Error Format" : error.message;

        setCsvUploadStatus((prev) => ({
          ...prev,
          group: { ...prev.group, uploading: false, error: errorMessage },
        }));
      }
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  // Handle examiner drag and drop
  const handleExaminerDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleExaminerDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    handleExaminerFileSelect(file);
  };

  const handleGroupDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleGroupDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    handleGroupFileSelect(file);
  };

  // Navigate between steps
  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  // Handle form submission
  const handleSubmit = async (isDraft = false) => {
    // Step validations
    if (!validateStep(1)) {
      setStep(1);
      return;
    }
    if (!validateStep(2)) {
      setStep(2);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create assignment using parent's function
      const result = await createAssignment(formData, isDraft);

      if (result.success) {
        // Store created assignment for post-creation quick navigation
        setCreatedAssignment(result.data);
        // If not draft, upload CSV data using assignment ID from creation result
        if (!isDraft) {
          const assignmentId = result.data.id;
          try {
            // Upload student CSV data
            if (csvData.student.file) {
              const uploadResult = await uploadStudentCsv(
                csvData.student.file,
                "student",
                assignmentId
              );
              console.log("Student CSV uploaded successfully");
            }

            // Upload examiner CSV data
            if (csvData.examiner.file) {
              const uploadResult = await uploadExaminerCsv(
                csvData.examiner.file,
                assignmentId
              );
              console.log("Examiner CSV uploaded successfully");
            }

            if (csvData.group.file) {
              const uploadResult = await uploadGroupCsv(
                csvData.group.file,
                assignmentId
              );
              console.log("Group CSV uploaded successfully");
            }
          } catch (uploadError) {
            console.error("CSV upload error:", uploadError);
            showNotification(
              "warning",
              "Assignment created but CSV upload failed. You can upload CSV data later."
            );
          }
        }

        setShowSuccess(true);

        // Celebration animation
        setTimeout(() => {
          onAssignmentCreated(result.data);
        }, 2500);
      } else {
        // Handle backend validation errors
        const errorMessage =
          result.data || result.message || "Failed to create assignment";
        showNotification("error", errorMessage);
      }
    } catch (error) {
      showNotification("error", "Failed to create assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get assignment type icon and color
  const getTypeStyles = (type) => {
    switch (type) {
      case "individual":
        return {
          icon: "fa-user",
          bgColor: "bg-indigo-50 dark:bg-indigo-900/30",
          borderColor: "border-indigo-200 dark:border-indigo-800",
          textColor: "text-indigo-700 dark:text-indigo-300",
          iconColor: "text-indigo-500",
          activeBg: "bg-indigo-100 dark:bg-indigo-800",
          activeText: "text-indigo-800 dark:text-indigo-200",
        };
      case "group":
        return {
          icon: "fa-users",
          bgColor: "bg-pink-50 dark:bg-pink-900/30",
          borderColor: "border-pink-200 dark:border-pink-800",
          textColor: "text-pink-700 dark:text-pink-300",
          iconColor: "text-pink-500",
          activeBg: "bg-pink-100 dark:bg-pink-800",
          activeText: "text-pink-800 dark:text-pink-200",
        };
      case "mixed":
        return {
          icon: "fa-layer-group",
          bgColor: "bg-teal-50 dark:bg-teal-900/30",
          borderColor: "border-teal-200 dark:border-teal-800",
          textColor: "text-teal-700 dark:text-teal-300",
          iconColor: "text-teal-500",
          activeBg: "bg-teal-100 dark:bg-teal-800",
          activeText: "text-teal-800 dark:text-teal-200",
        };
    }
  };

  // Normalize preview summary counts to support different backend shapes
  const getCounts = (summary) => {
    const total =
      summary?.totalCount ??
      summary?.totalRecords ??
      summary?.total ??
      (Array.isArray(summary?.preview) ? summary.preview.length : 0) ??
      0;
    const newCount = summary?.newCount ?? summary?.created ?? 0;
    const existingCount =
      summary?.existingCount ?? summary?.existing ?? summary?.duplicates ?? 0;
    return { total, newCount, existingCount };
  };

  const formatHistoryLabel = (item) => {
    const filename = item?.originalFilename || "previous_upload.csv";
    const assignmentLabel = item?.assignmentName || `Assignment ${item?.assignmentId ?? ""}`;
    let timestamp = "Unknown time";
    if (item?.createTime) {
      const parsed = new Date(item.createTime);
      if (!Number.isNaN(parsed.getTime())) {
        timestamp = parsed.toLocaleString();
      }
    }
    return `${assignmentLabel} - ${filename} (${timestamp})`;
  };

  const renderHistoryDropdown = (type) => {
    const state = csvHistoryState[type] || {
      loading: false,
      error: null,
      items: [],
    };
    const hasItems = Array.isArray(state.items) && state.items.length > 0;
    if (!hasItems && !state.loading && !state.error) {
      return null;
    }

    const disabled = state.loading || csvUploadStatus[type]?.uploading;
    const selection = csvHistorySelection[type] || "";

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Reuse previous CSV
          </label>
          {state.loading && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Loading...
            </span>
          )}
        </div>
        {state.error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}
        {hasItems && (
          <>
            <select
              className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              value={selection}
              onChange={(e) => handleHistorySelection(type, e.target.value)}
              disabled={disabled}
            >
              <option value="">Select a previous upload</option>
              {state.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {formatHistoryLabel(item)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Selecting a record loads and previews the CSV automatically.
            </p>
          </>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const stepCompletion = getStepCompletion();
  const isAssignmentCreated = Boolean(createdAssignment?.id);
  const requiresGroupCsv = formData.type === "group";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Create New Assignment
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {courseName} ({courseCode}) • {courseSemester.split(" ")[0]}{" "}
              Semester {courseSemester.split(" ")[1]}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            {/* Step circles with flex layout */}
            <div className="flex items-center justify-center">
              {[1, 2, 3].map((num, index) => (
                <div key={num} className="flex items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-300
                      ${
                        step >= num
                          ? "bg-blue-600 text-white scale-110 shadow-lg"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }
                      ${
                        stepCompletion[num] && step !== num
                          ? "ring-2 ring-green-500 ring-offset-2"
                          : ""
                      }
                    `}
                  >
                    {stepCompletion[num] ? (
                      <i className="fas fa-check"></i>
                    ) : (
                      num
                    )}
                  </div>
                  {index < 2 && (
                    <div
                      className={`
                        h-1 w-32 mx-3 rounded-full transition-all duration-500
                        ${
                          step > num
                            ? "bg-blue-600"
                            : "bg-gray-200 dark:bg-gray-700"
                        }
                      `}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step labels with precise positioning */}
            <div className="flex justify-center mt-2 relative">
              <div className="flex items-center">
                {/* First label */}
                <div className="w-10 flex justify-center">
                  <span
                    className={`text-xs whitespace-nowrap ${
                      step >= 1
                        ? "text-blue-600 dark:text-blue-400 font-medium"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Assignment Details
                  </span>
                </div>

                {/* Spacer for first line */}
                <div style={{ width: "152px" }}></div>

                {/* Second label */}
                <div className="w-10 flex justify-center">
                  <span
                    className={`text-xs whitespace-nowrap ${
                      step >= 2
                        ? "text-blue-600 dark:text-blue-400 font-medium"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Participants
                  </span>
                </div>

                {/* Spacer for second line */}
                <div style={{ width: "152px" }}></div>

                {/* Third label */}
                <div className="w-10 flex justify-center">
                  <span
                    className={`text-xs whitespace-nowrap ${
                      step >= 3
                        ? "text-blue-600 dark:text-blue-400 font-medium"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Summary
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div
          ref={contentRef}
          className="p-6 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 280px)" }}
        >
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Assignment Details */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-info-circle text-white"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Assignment Information
                  </h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assignment Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className={`
                        w-full rounded-lg px-4 py-2.5 text-sm
                        bg-white dark:bg-gray-700 
                        border ${
                          validationErrors.name
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                        transition-all duration-200
                      `}
                      placeholder="e.g. Mid-Semester Project Presentation"
                    />
                    {validationErrors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validationErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      rows={3}
                      className="w-full rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      placeholder="Provide a brief description of this assignment..."
                    />
                  </div>
                </div>
              </div>

              {/* Assignment Type Selection */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-sitemap text-white"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Assignment Type
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {["individual", "group", "mixed"].map((type) => {
                    const styles = getTypeStyles(type);
                    return (
                      <button
                        key={type}
                        onClick={() => handleInputChange("type", type)}
                        className={`
                          relative p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-105
                          ${
                            formData.type === type
                              ? `${styles.activeBg} ${styles.borderColor} ring-2 ring-offset-2 ring-blue-500 shadow-lg`
                              : `${styles.bgColor} ${styles.borderColor} hover:shadow-md`
                          }
                        `}
                      >
                        <div className="flex flex-col items-center">
                          <i
                            className={`fas ${styles.icon} text-2xl ${styles.iconColor} mb-2`}
                          ></i>
                          <span
                            className={`font-medium capitalize ${
                              formData.type === type
                                ? styles.activeText
                                : styles.textColor
                            }`}
                          >
                            {type}
                          </span>
                          <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                            {type === "individual" &&
                              "Each student assessed separately"}
                            {type === "group" && "Students assessed as teams"}
                            {type === "mixed" &&
                              "Group + individual components"}
                          </span>
                        </div>
                        {formData.type === type && (
                          <div className="absolute top-2 right-2">
                            <i className="fas fa-check-circle text-blue-600"></i>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scheduling & Grading */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-calendar-alt text-white"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Scheduling & Grading
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date & Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) =>
                          handleInputChange("startDate", e.target.value)
                        }
                        className={`
                          w-full rounded-lg pl-6 pr-4 py-2.5 text-sm
                          bg-white dark:bg-gray-700 
                          border ${
                            validationErrors.startDate
                              ? "border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          }
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                          transition-all duration-200
                        `}
                      />
                      <i className="fas fa-calendar-clock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    {validationErrors.startDate && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validationErrors.startDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date & Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) =>
                          handleInputChange("endDate", e.target.value)
                        }
                        min={formData.startDate || undefined}
                        className={`
                          w-full rounded-lg pl-6 pr-4 py-2.5 text-sm
                          bg-white dark:bg-gray-700 
                          border ${
                            validationErrors.endDate
                              ? "border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          }
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                          transition-all duration-200
                        `}
                      />
                      <i className="fas fa-calendar-clock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    {validationErrors.endDate && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validationErrors.endDate}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Weight <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            handleInputChange("weight", "");
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue)) {
                              handleInputChange("weight", numValue);
                            }
                          }
                        }}
                        onWheel={(e) => {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }}
                        min="0"
                        max="100"
                        className={`
                          w-full rounded-lg px-4 py-2.5 pr-12 text-sm
                          bg-white dark:bg-gray-700 
                          border ${
                            validationErrors.weight
                              ? "border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          }
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                          transition-all duration-200
                        `}
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                        %
                      </span>
                    </div>
                    {validationErrors.weight && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validationErrors.weight}
                      </p>
                    )}
                    {!validationErrors.weight && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Total weight across all assignments for a course must
                        not exceed 100%.
                      </p>
                    )}
                    {/* Course total weight indicator */}
                    <div className="mt-1 text-xs">
                      {courseWeightTotal.loading ? (
                        <span className="text-gray-500 dark:text-gray-400">
                          Calculating current course total…
                        </span>
                      ) : courseWeightTotal.error ? null : (
                        (() => {
                          const base = Number(courseWeightTotal.value || 0);
                          const curr = Number(formData.weight || 0);
                          const projected = base + curr;
                          const over = projected > 100;
                          return (
                            <span
                              className={
                                over
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }
                            >
                              Current course total (excluding this): {base}% ·
                              Projected total: {projected}%
                              {over ? " — exceeds 100%" : ""}
                            </span>
                          );
                        })()
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              formData.weight === "" || !formData.weight
                                ? 0
                                : formData.weight
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: CSV Upload */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Student CSV Upload */}
              <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-5 border border-sky-200 dark:border-sky-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-file-csv text-white"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Upload Student Data
                  </h4>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Upload a CSV file with student information. This step is
                  required. The CSV data will be uploaded right after the
                  assignment is created.
                </p>
                <div className="mb-4 text-xs">
                  <a
                    href="/csv-templates/student_template.csv"
                    download
                    className="text-blue-600 dark:text-blue-400 hover:underline mr-3"
                  >
                    <i className="fas fa-download mr-1"></i>Download Student CSV
                    template
                  </a>
                </div>
                {renderHistoryDropdown("student")}
                {validationErrors.studentCsv && (
                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      {validationErrors.studentCsv}
                    </p>
                  </div>
                )}

                {!csvData.student.previewData ? (
                  !csvData.student.file ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                        ${
                          isDragging
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                        }
                      `}
                    >
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileSelect(e.target.files[0])}
                        className="hidden"
                        id="student-file-input"
                      />

                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <i className="fas fa-cloud-upload-alt text-2xl text-gray-400"></i>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Drag and drop your CSV file here, or
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          const fileInput =
                            document.getElementById("student-file-input");
                          if (fileInput) fileInput.click();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Browse Files
                      </button>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                        Supported format: CSV (.csv)
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <i className="fas fa-file-alt text-green-600 mr-3"></i>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {csvData.student.file
                                ? csvData.student.file.name
                                : ""}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              File selected, ready to upload
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setCsvData((prev) => ({
                              ...prev,
                              student: {
                                file: null,
                                type: prev.student.type,
                                previewData: null,
                              },
                            }));
                            setCsvUploadStatus((prev) => ({
                              ...prev,
                              student: { uploading: false, error: null },
                            }));
                          }}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => handleCsvPreview("student")}
                          disabled={csvUploadStatus.student.uploading}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          {csvUploadStatus.student.uploading ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-upload mr-2"></i>
                              Upload Student Data
                            </>
                          )}
                        </button>
                      </div>

                      {/* Error display */}
                      {csvUploadStatus.student.error && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-sm text-red-700 dark:text-red-300">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            {csvUploadStatus.student.error}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <i className="fas fa-check-circle text-green-600 mr-2"></i>
                        <span className="font-medium text-green-800 dark:text-green-200">
                          Upload Successful
                        </span>
                      </div>
                      {(() => {
                        const c = getCounts(csvData.student.previewData);
                        return (
                          <div className="text-sm text-green-600 dark:text-green-400">
                            <span className="mr-3">Total: {c.total}</span>
                            {c.newCount ? (
                              <span className="mr-3 text-blue-600">
                                New: {c.newCount}
                              </span>
                            ) : null}
                            {c.existingCount ? (
                              <span className="text-orange-600">
                                Existing: {c.existingCount}
                              </span>
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Statistics Summary */}
                    {(() => {
                      const c = getCounts(csvData.student.previewData);
                      return (
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                              {c.newCount}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              New Students
                            </div>
                          </div>
                          <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                              {c.existingCount}
                            </div>
                            <div className="text-xs text-orange-600 dark:text-orange-400">
                              Existing Students
                            </div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">
                              {c.total}
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-400">
                              Total
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => {
                        setCsvData((prev) => ({
                          ...prev,
                          student: {
                            file: null,
                            type: prev.student.type,
                            previewData: null,
                          },
                        }));
                      }}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <i className="fas fa-redo mr-1"></i>
                      Re-upload
                    </button>
                  </div>
                )}

              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-amber-600 mt-0.5 mr-3"></i>
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">Student CSV Format:</p>
                    <p className="text-xs">
                      Student, ID, SIS User ID, SIS Login ID, Section, Student
                      Id
                    </p>
                  </div>
                </div>
              </div>
            </div>

              {/* Group CSV Upload */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-5 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-users text-white"></i>
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Upload Group Data
                    </h4>
                    <span
                      className={`text-xs font-medium mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-full w-fit ${
                        requiresGroupCsv
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                      }`}
                    >
                      <i className="fas fa-info-circle" />
                      {requiresGroupCsv
                        ? "Required for group assignments"
                        : "Optional for individual assignments"}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Provide a CSV mapping students into groups. Individual assignments can skip this step, but group assignments should upload the latest roster.
                </p>
                <div className="mb-4 text-xs">
                  <a
                    href="/csv-templates/group_template.csv"
                    download
                    className="text-emerald-600 dark:text-emerald-400 hover:underline mr-3"
                  >
                    <i className="fas fa-download mr-1"></i>Download Group CSV template
                  </a>
                </div>
                {renderHistoryDropdown("group")}
                {validationErrors.groupCsv && (
                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      {validationErrors.groupCsv}
                    </p>
                  </div>
                )}

                {!csvData.group.previewData ? (
                  !csvData.group.file ? (
                    <div
                      onDragOver={handleGroupDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleGroupDrop}
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                        ${
                          isDragging
                            ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-900/30"
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                        }
                      `}
                    >
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleGroupFileSelect(e.target.files[0])}
                        className="hidden"
                        id="group-file-input"
                      />

                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <i className="fas fa-cloud-upload-alt text-2xl text-gray-400"></i>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Drag and drop your CSV file here, or
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          const fileInput = document.getElementById(
                            "group-file-input"
                          );
                          if (fileInput) fileInput.click();
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Browse Files
                      </button>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                        Supported format: CSV (.csv)
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <i className="fas fa-file-alt text-green-600 mr-3"></i>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {csvData.group.file ? csvData.group.file.name : ""}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              File selected, ready to upload
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setCsvData((prev) => ({
                              ...prev,
                              group: { file: null, previewData: null },
                            }));
                            setCsvUploadStatus((prev) => ({
                              ...prev,
                              group: { uploading: false, error: null },
                            }));
                          }}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => handleCsvPreview("group")}
                          disabled={csvUploadStatus.group.uploading}
                          className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          {csvUploadStatus.group.uploading ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-upload mr-2"></i>
                              Validate Group Data
                            </>
                          )}
                        </button>
                      </div>

                      {csvUploadStatus.group.error && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-sm text-red-700 dark:text-red-300">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            {csvUploadStatus.group.error}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <i className="fas fa-check-circle text-green-600 mr-2"></i>
                        <span className="font-medium text-green-800 dark:text-green-200">
                          Upload Successful
                        </span>
                      </div>
                      {(() => {
                        const c = getCounts(csvData.group.previewData);
                        const groupCount =
                          csvData.group.previewData?.groupCount ?? null;
                        return (
                          <div className="text-sm text-green-600 dark:text-green-400">
                            <span className="mr-3">Total rows: {c.total}</span>
                            {typeof groupCount === "number" && (
                              <span className="text-emerald-600 mr-3">
                                Groups: {groupCount}
                              </span>
                            )}
                            {c.newCount ? (
                              <span className="text-blue-600 mr-3">
                                New records: {c.newCount}
                              </span>
                            ) : null}
                            {c.existingCount ? (
                              <span className="text-orange-600">
                                Existing: {c.existingCount}
                              </span>
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {(() => {
                        const c = getCounts(csvData.group.previewData);
                        return (
                          <>
                            <div className="bg-emerald-100 dark:bg-emerald-900/40 rounded-lg p-3 text-center">
                              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                {csvData.group.previewData?.groupCount ?? "—"}
                              </div>
                              <div className="text-xs text-emerald-700 dark:text-emerald-300">
                                Groups
                              </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {c.newCount}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                New Records
                              </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
                              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                {c.total}
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-400">
                                Total Rows
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCsvData((prev) => ({
                          ...prev,
                          group: { file: null, previewData: null },
                        }));
                      }}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <i className="fas fa-redo mr-1"></i>
                      Re-upload
                    </button>
                  </div>
                )}

                <div className="mt-4 p-4 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="flex items-start">
                    <i className="fas fa-info-circle text-emerald-600 mt-0.5 mr-3"></i>
                    <div className="text-sm text-emerald-800 dark:text-emerald-200">
                      <p className="font-medium mb-1">Group CSV Format:</p>
                      <p className="text-xs">
                        Expected headers: name, canvas_user_id, user_id, login_id, sections, group_name, canvas_group_id, group_id. Extra columns are ignored.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Examiner CSV Upload */}
              <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-5 border border-sky-200 dark:border-sky-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-user-tie text-white"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Upload Examiner Data
                  </h4>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Upload a CSV file with examiner information. This step is
                  required. The CSV data will be uploaded right after the
                  assignment is created.
                </p>
                <div className="mb-4 text-xs">
                  <a
                    href="/csv-templates/examiner_template.csv"
                    download
                    className="text-blue-600 dark:text-blue-400 hover:underline mr-3"
                  >
                    <i className="fas fa-download mr-1"></i>Download Examiner
                    CSV template
                  </a>
                </div>
                {renderHistoryDropdown("examiner")}
                {validationErrors.examinerCsv && (
                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      {validationErrors.examinerCsv}
                    </p>
                  </div>
                )}

                {!csvData.examiner.previewData ? (
                  !csvData.examiner.file ? (
                    <div
                      onDragOver={handleExaminerDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleExaminerDrop}
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                        ${
                          isDragging
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                        }
                      `}
                    >
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) =>
                          handleExaminerFileSelect(e.target.files[0])
                        }
                        className="hidden"
                        id="examiner-file-input"
                      />

                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <i className="fas fa-cloud-upload-alt text-2xl text-gray-400"></i>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Drag and drop your CSV file here, or
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          const fileInput = document.getElementById(
                            "examiner-file-input"
                          );
                          if (fileInput) fileInput.click();
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Browse Files
                      </button>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                        Supported format: CSV (.csv)
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <i className="fas fa-file-alt text-green-600 mr-3"></i>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {csvData.examiner.file
                                ? csvData.examiner.file.name
                                : ""}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              File selected, ready to upload
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setCsvData((prev) => ({
                              ...prev,
                              examiner: { file: null, previewData: null },
                            }));
                            setCsvUploadStatus((prev) => ({
                              ...prev,
                              examiner: { uploading: false, error: null },
                            }));
                          }}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => handleCsvPreview("examiner")}
                          disabled={csvUploadStatus.examiner.uploading}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          {csvUploadStatus.examiner.uploading ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-upload mr-2"></i>
                              Upload Examiner Data
                            </>
                          )}
                        </button>
                      </div>

                      {/* Error display */}
                      {csvUploadStatus.examiner.error && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-sm text-red-700 dark:text-red-300">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            {csvUploadStatus.examiner.error}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <i className="fas fa-check-circle text-green-600 mr-2"></i>
                        <span className="font-medium text-green-800 dark:text-green-200">
                          Upload Successful
                        </span>
                      </div>
                      {(() => {
                        const c = getCounts(csvData.examiner.previewData);
                        return (
                          <div className="text-sm text-green-600 dark:text-green-400">
                            <span className="mr-3">Total: {c.total}</span>
                            {c.newCount ? (
                              <span className="mr-3 text-blue-600">
                                New: {c.newCount}
                              </span>
                            ) : null}
                            {c.existingCount ? (
                              <span className="text-orange-600">
                                Existing: {c.existingCount}
                              </span>
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Statistics Summary for Examiners */}
                    {(() => {
                      const c = getCounts(csvData.examiner.previewData);
                      return (
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                              {c.newCount}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              New Examiners
                            </div>
                          </div>
                          <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                              {c.existingCount}
                            </div>
                            <div className="text-xs text-orange-600 dark:text-orange-400">
                              Existing Examiners
                            </div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">
                              {c.total}
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-400">
                              Total
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => {
                        setCsvData((prev) => ({
                          ...prev,
                          examiner: { file: null, previewData: null },
                        }));
                      }}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <i className="fas fa-redo mr-1"></i>
                      Re-upload
                    </button>
                  </div>
                )}

                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start">
                    <i className="fas fa-info-circle text-amber-600 mt-0.5 mr-3"></i>
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-medium mb-1">Examiner CSV Format:</p>
                      <p className="text-xs">
                        Headers must exactly match (order matters): Email, Name,
                        Department, ID, SIS User ID, SIS Login ID
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Configuration Summary */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Assignment Summary
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Name
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Type
                    </span>
                    <span
                      className={`
                      px-3 py-1 rounded-full text-xs font-medium capitalize
                      ${
                        formData.type === "individual"
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                          : ""
                      }
                      ${
                        formData.type === "group"
                          ? "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300"
                          : ""
                      }
                      ${
                        formData.type === "mixed"
                          ? "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300"
                          : ""
                      }
                    `}
                    >
                      {formData.type}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Period
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.startDate} to {formData.endDate}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Weight
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.weight}%
                    </span>
                  </div>

                  {csvData.student.file && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Student CSV
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {csvData.student.file.name}
                      </span>
                    </div>
                  )}

                  {csvData.examiner.file && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Examiner CSV
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {csvData.examiner.file.name}
                      </span>
                    </div>
                  )}

                  {csvData.group.file && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Group CSV
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {csvData.group.file.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-5 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-cogs text-white"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Configure Components
                  </h4>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  After creating the assignment, you can configure these
                  components:
                </p>

                <div className="space-y-3">
                  <button
                    type="button"
                    aria-disabled={!isAssignmentCreated}
                    disabled={!isAssignmentCreated}
                    onClick={() => {
                      if (createdAssignment?.id) {
                        router.push(
                          `/admin/courses/${courseId}/assignments/${createdAssignment.id}/rubric`
                        );
                      } else {
                        showNotification(
                          "info",
                          "Create the assignment first to configure the rubric"
                        );
                      }
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-amber-400 hover:shadow-md transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                        <i className="fas fa-clipboard-list text-amber-600"></i>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Configure Rubric
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Set up assessment criteria
                        </p>
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-gray-400 group-hover:translate-x-1 transition-transform"></i>
                  </button>

                  <button
                    type="button"
                    aria-disabled={!isAssignmentCreated}
                    disabled={!isAssignmentCreated}
                    onClick={() => {
                      if (createdAssignment?.id) {
                        router.push(
                          `/admin/courses/${courseId}/assignments/${createdAssignment.id}/timeslots`
                        );
                      } else {
                        showNotification(
                          "info",
                          "Create the assignment first to schedule timeslots"
                        );
                      }
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-cyan-400 hover:shadow-md transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                        <i className="fas fa-calendar-plus text-cyan-600"></i>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Schedule Timeslots
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Schedule assessment timeslots
                        </p>
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-gray-400 group-hover:translate-x-1 transition-transform"></i>
                  </button>

                  <button
                    type="button"
                    aria-disabled={!isAssignmentCreated}
                    disabled={!isAssignmentCreated}
                    onClick={() => {
                      if (createdAssignment?.id) {
                        router.push(
                          `/admin/courses/${courseId}/assignments/${createdAssignment.id}/timeslots`
                        );
                      } else {
                        showNotification(
                          "info",
                          "Create the assignment first to manage examiner assignments"
                        );
                      }
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-lime-400 hover:shadow-md transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-lime-100 dark:bg-lime-900/50 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                        <i className="fas fa-user-shield text-lime-600"></i>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Assign Examiners
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Manage examiner assignments
                        </p>
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-gray-400 group-hover:translate-x-1 transition-transform"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Animation */}
          {showSuccess && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center animate-bounceIn">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <i className="fas fa-check text-3xl text-green-600 animate-scaleIn"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Assignment Created!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Next: Configure your rubric and schedule timeslots Next:
                  Configure your rubric and schedule timeslots
                </p>
                <div className="mt-4">
                  <div className="inline-flex items-center justify-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className="text-2xl animate-bounce"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        🎉
                      </span>
                    ))}
                  </div>
                </div>
                {createdAssignment?.id && (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/admin/courses/${courseId}/assignments/${createdAssignment.id}/rubric`
                        )
                      }
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go to Rubric
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/admin/courses/${courseId}/assignments/${createdAssignment.id}/timeslots`
                        )
                      }
                      className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors"
                    >
                      Set Up Time Slots
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div>
            {step === 3 && (
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Previous
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  isSubmitting ||
                  (step === 1 && !isStep1Ready()) ||
                  (step === 2 && !isStep2Ready())
                }
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                Next
                <i className="fas fa-arrow-right ml-2"></i>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Create Assignment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
