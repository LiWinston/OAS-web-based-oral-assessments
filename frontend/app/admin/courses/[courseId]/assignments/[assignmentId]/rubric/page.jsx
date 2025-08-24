"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GripVertical,
  Plus,
  Save,
  ArrowLeft,
  Sparkles,
  Award,
  Target,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Users,
  Calendar,
  FileText,
} from "lucide-react";
import { useNotification } from "@/hooks/useNotification";
import RubricCriterion from "@/components/admin/rubric/RubricCriterion";
import RubricPreview from "@/components/admin/rubric/RubricPreview";
import { rubricService } from "@/services/rubricService";
import { assignmentService } from "@/services/assignmentService";
import { courseService } from "@/services/courseService";

export default function RubricConfigurationPage() {
  const params = useParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [showWelcome, setShowWelcome] = useState(true);

  // Data states
  const [course, setCourse] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [rubric, setRubric] = useState({
    id: null,
    name: "",
    description: "",
    totalPoints: 100,
    criteria: [],
  });

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();

    // Ensure welcome animation doesn't get stuck
    const welcomeTimer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);

    return () => clearTimeout(welcomeTimer);
  }, [params.courseId, params.assignmentId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      console.log("Fetching data for:", {
        courseId: params.courseId,
        assignmentId: params.assignmentId
      });

      // Fetch course and assignment details
      const [courseResponse, assignmentResponse] = await Promise.all([
        courseService.getCourse(params.courseId),
        assignmentService.getAssignmentById(params.assignmentId),
      ]);

      console.log("Course response:", courseResponse);
      console.log("Assignment response:", assignmentResponse);

      // Handle course response
      if (!courseResponse.success) {
        throw new Error("Course not found");
      }

      setCourse(courseResponse.data);
      
      // Handle assignment response - check if it's wrapped in a success structure
      let assignmentData = assignmentResponse;
      if (assignmentResponse.success !== undefined) {
        assignmentData = assignmentResponse.data;
      }
      
      // Map backend field names to frontend expected names
      const mappedAssignment = {
        id: assignmentData.id,
        title: assignmentData.name || assignmentData.title,
        description: assignmentData.description,
        type: assignmentData.type,
        dueDate: assignmentData.endDate || assignmentData.dueDate,
        startDate: assignmentData.startDate,
        weight: assignmentData.weight,
        status: assignmentData.status,
        rubricId: assignmentData.rubricId
      };

      setAssignment(mappedAssignment);

      // Check if assignment has rubric data
      // Handle both rubricInfo and rubricsInfo (backend inconsistency)
      const rubricInfoArray = assignmentData.rubricInfo || assignmentData.rubricsInfo;
      let rubricMetaInfo = assignmentData.rubricMetaInfo;
      
      // Parse rubricMetaInfo if it's a string
      if (typeof rubricMetaInfo === 'string') {
        try {
          rubricMetaInfo = JSON.parse(rubricMetaInfo);
        } catch (e) {
          console.warn('Failed to parse rubricMetaInfo:', e);
          rubricMetaInfo = null;
        }
      }
      
      if (rubricMetaInfo && rubricInfoArray && Array.isArray(rubricInfoArray)) {
        // Convert backend rubric format to frontend format
        const convertedRubric = {
          id: assignmentData.id + "_rubric", // Generate a consistent ID
          name: rubricMetaInfo.name || `${mappedAssignment.title} Rubric`,
          description: rubricMetaInfo.description || "",
          totalPoints: rubricMetaInfo.totalPoints || 100,
          criteria: rubricInfoArray.map((criterion, index) => ({
            id: `criterion_${index}`,
            title: criterion.description,
            description: "",
            weight: criterion.weight,
            markingScale: criterion.scaleType || "descriptive",
            levels: criterion.performanceLevel && Array.isArray(criterion.performanceLevel) 
              ? criterion.performanceLevel.map((level, levelIndex) => ({
                  id: `level_${levelIndex}`,
                  name: level.description || `Level ${levelIndex + 1}`,
                  description: level.description || "",
                  minPoints: level.startPoint,
                  maxPoints: level.endPoint,
                  color: ["green", "blue", "yellow", "orange", "red"][levelIndex] || "gray"
                }))
              : [], // Default empty levels if not provided
            comments: []
          }))
        };
        
        console.log("Converted rubric from backend:", convertedRubric);
        setRubric(convertedRubric);
        setHasChanges(false); // Reset changes flag when loading existing data
      } else {
        console.log("No valid rubric data found, initializing with default");
        // Initialize with default criterion
        setRubric({
          ...rubric,
          name: `${mappedAssignment.title} Rubric`,
          criteria: [createDefaultCriterion()],
        });
      }
    } catch (error) {
      console.error("Error loading rubric data:", error);
      showNotification({
        type: "error",
        title: "Error loading data",
        message: error.message || "Failed to load rubric configuration",
      });
      // Still hide welcome on error
      setShowWelcome(false);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultCriterion = () => ({
    id: Date.now().toString(),
    title: "New Criterion",
    description: "",
    weight: 100,
    markingScale: "descriptive",
    levels: [
      {
        id: "1",
        name: "Outstanding",
        description: "",
        minPoints: 90,
        maxPoints: 100,
        color: "green",
      },
      {
        id: "2",
        name: "Very Good",
        description: "",
        minPoints: 80,
        maxPoints: 89,
        color: "blue",
      },
      {
        id: "3",
        name: "Good",
        description: "",
        minPoints: 70,
        maxPoints: 79,
        color: "yellow",
      },
      {
        id: "4",
        name: "Satisfactory",
        description: "",
        minPoints: 60,
        maxPoints: 69,
        color: "orange",
      },
      {
        id: "5",
        name: "Needs Improvement",
        description: "",
        minPoints: 0,
        maxPoints: 59,
        color: "red",
      },
    ],
    comments: [],
  });

  // Handlers
  const handleAddCriterion = () => {
    const newCriterion = createDefaultCriterion();
    setRubric({
      ...rubric,
      criteria: [...(rubric.criteria || []), newCriterion],
    });
    setHasChanges(true);
    showNotification({
      type: "success",
      title: "Criterion added",
      message: "New criterion has been added to the rubric",
    });
  };

  const handleUpdateCriterion = (index, updatedCriterion) => {
    const newCriteria = [...(rubric.criteria || [])];
    newCriteria[index] = updatedCriterion;
    setRubric({ ...rubric, criteria: newCriteria });
    setHasChanges(true);
  };

  const handleDeleteCriterion = (index) => {
    if (!rubric.criteria || rubric.criteria.length === 1) {
      showNotification({
        type: "error",
        title: "Cannot delete",
        message: "Rubric must have at least one criterion",
      });
      return;
    }

    const newCriteria = rubric.criteria.filter((_, i) => i !== index);
    setRubric({ ...rubric, criteria: newCriteria });
    setHasChanges(true);
    showNotification({
      type: "success",
      title: "Criterion deleted",
      message: "Criterion has been removed from the rubric",
    });
  };

  const handleDuplicateCriterion = (index) => {
    if (!rubric.criteria || !rubric.criteria[index]) return;
    const criterionToDuplicate = rubric.criteria[index];
    const duplicatedCriterion = {
      ...criterionToDuplicate,
      id: Date.now().toString(),
      title: `${criterionToDuplicate.title} (Copy)`,
      comments: criterionToDuplicate.comments.map((comment) => ({
        ...comment,
        id: Date.now().toString() + Math.random(),
      })),
    };

    const newCriteria = [...(rubric.criteria || [])];
    newCriteria.splice(index + 1, 0, duplicatedCriterion);
    setRubric({ ...rubric, criteria: newCriteria });
    setHasChanges(true);
    showNotification({
      type: "success",
      title: "Criterion duplicated",
      message: "Criterion has been duplicated successfully",
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex || !rubric.criteria) return;

    const draggedCriterion = rubric.criteria[draggedIndex];
    const newCriteria = [...rubric.criteria];

    // Remove dragged item
    newCriteria.splice(draggedIndex, 1);

    // Insert at new position
    const adjustedDropIndex =
      draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newCriteria.splice(adjustedDropIndex, 0, draggedCriterion);

    setRubric({ ...rubric, criteria: newCriteria });
    setDraggedIndex(null);
    setHasChanges(true);
  };

  const handleSaveRubric = async () => {
    console.log("Save Rubric clicked!");
    console.log("Current rubric:", rubric);
    console.log("Has changes:", hasChanges);
    console.log("Button disabled?", isSaving);
    
    // Validate rubric
    if (!rubric.name.trim()) {
      console.error("Validation failed: No rubric name");
      showNotification({
        type: "error",
        title: "Validation error",
        message: "Please provide a name for the rubric",
      });
      return;
    }

    if (!rubric.criteria || rubric.criteria.length === 0) {
      console.error("Validation failed: No criteria");
      showNotification({
        type: "error",
        title: "Validation error",
        message: "Rubric must have at least one criterion",
      });
      return;
    }
    
    console.log("Criteria validation passed:", rubric.criteria.length, "criteria found");

    // Validate total weight equals 100%
    const totalWeight = rubric.criteria.reduce(
      (sum, c) => sum + (c.weight || 0),
      0
    );
    if (totalWeight !== 100) {
      showNotification({
        type: "error",
        title: "Validation error",
        message: `Total weight must equal 100%. Current total: ${totalWeight}%`,
      });
      return;
    }

    try {
      setIsSaving(true);

      const rubricSaveData = {
        ...rubric,
        assignmentId: params.assignmentId,
        courseId: params.courseId,
        // Include assignment data for the backend
        assignmentName: assignment?.title,
        assignmentDescription: assignment?.description,
        assignmentType: assignment?.type,
        startDate: assignment?.startDate,
        endDate: assignment?.dueDate,
        weight: assignment?.weight,
        status: assignment?.status,
      };

      console.log("Saving rubric with data:", rubricSaveData);
      console.log("Assignment data:", assignment);
      console.log("Course ID:", params.courseId);

      // Save rubric (both create and update use the same method now)
      const rubricResponse = await rubricService.createRubric(rubricSaveData);

      // Handle rubric response structure
      const savedRubric = rubricResponse.success !== undefined ? rubricResponse.data : rubricResponse;
      
      // If we have a saved rubric with updated information, use it
      // Otherwise, keep the current rubric but mark as saved
      if (savedRubric && savedRubric.id) {
        setRubric(savedRubric);
      } else {
        // If no ID returned, just mark as saved by adding an ID
        setRubric({
          ...rubric,
          id: rubric.id || Date.now().toString()
        });
      }

      setHasChanges(false);

      showNotification({
        type: "success",
        title: "Rubric saved",
        message: "The rubric has been saved successfully",
      });
    } catch (error) {
      console.error("Save rubric error:", error);
      showNotification({
        type: "error",
        title: "Save failed",
        message: error.response?.data?.message || error.message || "Failed to save rubric",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading rubric configuration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Welcome Animation Overlay - Consistent Style */}
      {showWelcome && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-sm animate-fade-in cursor-pointer"
          onClick={() => setShowWelcome(false)}
        >
          <div className="text-center text-white animate-scale-in">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Award className="w-20 h-20 text-yellow-400 animate-bounce-slow" />
                <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 animate-slide-up">
              Rubric Configuration
            </h1>
            <p className="text-xl opacity-90 animate-slide-up animation-delay-200">
              Create meaningful assessment criteria for {assignment?.title}
            </p>
            <p className="text-sm opacity-70 mt-6 animate-fade-in">
              Click anywhere to continue
            </p>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation - Consistent Style */}
      <div className="mb-4">
        <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <ol className="flex items-center space-x-2">
            <li className="flex items-center">
              <Link
                href="/admin"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-1">
                  OAS
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  Dashboard
                </span>
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2"></i>
              <Link
                href="/admin/courses"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Courses
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2"></i>
              <Link
                href={`/admin/courses/${params.courseId}/assignments`}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {course?.courseCode || "Course"}
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2"></i>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {assignment?.title || "Assignment"} - Rubric
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Page Header - Consistent Style */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Award className="w-8 h-8 text-purple-600 mr-3" />
              Rubric Configuration
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Define assessment criteria and performance levels for{" "}
              {assignment?.title}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
            >
              {showPreview ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
              {showPreview ? "Hide" : "Show"} Preview
            </button>
            <button
              onClick={handleSaveRubric}
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                !isSaving
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Rubric
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Tips Section - Consistent with Other Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
        <div className="dashboard-card">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 text-purple-600 mr-2" />
              Assignment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Course:
                  </span>
                  <span className="font-medium">
                    {course?.courseCode || "Loading..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Assignment:
                  </span>
                  <span
                    className="font-medium text-right"
                    title={assignment?.title}
                  >
                    {assignment?.title || "Loading..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Type:
                  </span>
                  <span className="font-medium capitalize">
                    {assignment?.type || "N/A"}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Points:
                  </span>
                  <span className="font-medium">{rubric.totalPoints}</span>
                </div>
                {assignment?.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Due Date:
                    </span>
                    <span className="font-medium text-right">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Criteria:
                  </span>
                  <span className="font-medium">
                    {rubric.criteria?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Criteria Builder */}
        <div className="space-y-6">
          {/* Rubric Info */}
          <div className="dashboard-card">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 text-purple-600 mr-2" />
                Rubric Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rubric Name
                  </label>
                  <input
                    type="text"
                    value={rubric.name || ''}
                    onChange={(e) => {
                      setRubric({ ...rubric, name: e.target.value });
                      setHasChanges(true);
                    }}
                    className="form-control w-full"
                    placeholder="Enter rubric name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={rubric.description || ''}
                    onChange={(e) => {
                      setRubric({ ...rubric, description: e.target.value });
                      setHasChanges(true);
                    }}
                    className="form-control w-full"
                    rows={2}
                    placeholder="Brief description of this rubric"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Points
                  </label>
                  <input
                    type="number"
                    value={rubric.totalPoints || 100}
                    onChange={(e) => {
                      setRubric({
                        ...rubric,
                        totalPoints: parseInt(e.target.value) || 100,
                      });
                      setHasChanges(true);
                    }}
                    className="form-control w-full max-w-xs"
                    min={1}
                    max={1000}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Criteria List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                <Award className="w-5 h-5 text-purple-600 mr-2" />
                Assessment Criteria
              </h3>
              <button
                onClick={handleAddCriterion}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Criterion
              </button>
            </div>

            {/* Weight Validation Alert */}
            {rubric.criteria && rubric.criteria.length > 0 && (
              <div
                className={`p-4 rounded-lg flex items-center gap-3 ${
                  rubric.criteria.reduce(
                    (sum, c) => sum + (c.weight || 0),
                    0
                  ) === 100
                    ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                    : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                }`}
              >
                {rubric.criteria.reduce(
                  (sum, c) => sum + (c.weight || 0),
                  0
                ) === 100 ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Total weight: 100% ✓</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    <span>
                      Total weight:{" "}
                      {rubric.criteria.reduce(
                        (sum, c) => sum + (c.weight || 0),
                        0
                      )}
                      % (must equal 100%)
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Criteria Components */}
            <div className="space-y-4">
              {rubric.criteria && rubric.criteria.map((criterion, index) => (
                <RubricCriterion
                  key={criterion.id}
                  criterion={criterion}
                  index={index}
                  totalCriteria={rubric.criteria ? rubric.criteria.length : 0}
                  onUpdate={(updated) => handleUpdateCriterion(index, updated)}
                  onDelete={() => handleDeleteCriterion(index)}
                  onDuplicate={() => handleDuplicateCriterion(index)}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  isDragging={draggedIndex === index}
                />
              ))}
            </div>

            {(!rubric.criteria || rubric.criteria.length === 0) && (
              <div className="text-center py-12 dashboard-card">
                <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No criteria defined yet
                </p>
                <button onClick={handleAddCriterion} className="btn-primary">
                  Add First Criterion
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview Panel */}
        {showPreview && (
          <div className="lg:sticky lg:top-6 h-fit">
            <RubricPreview
              rubric={rubric}
              assignment={assignment}
              course={course}
            />
          </div>
        )}
      </div>
    </div>
  );
}
