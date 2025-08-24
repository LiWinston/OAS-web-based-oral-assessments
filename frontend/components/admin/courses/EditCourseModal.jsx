'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { courseService } from '../../../services/courseService';
import { useNotification } from '../../../hooks/useNotification';

export function EditCourseModal({ isOpen, onClose, onCourseUpdated, course }) {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    academicYear: '',
    semester: '',
    description: '',
    isActive: true
  });

  const [originalData, setOriginalData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Populate form when course data changes
  useEffect(() => {
    if (isOpen && course) {
      const initialData = {
        courseName: course.name || '',
        courseCode: course.code || '',
        academicYear: course.year?.toString() || '',
        semester: course.semester || '',
        description: course.description || '',
        isActive: course.isActive || course.status === 'active'
      };
      
      setFormData(initialData);
      setOriginalData(initialData);
      setHasChanges(false);
      setValidationErrors({});
    }
  }, [isOpen, course]);

  // Check for changes
  useEffect(() => {
    const changed = Object.keys(formData).some(key => 
      formData[key] !== originalData[key]
    );
    setHasChanges(changed);
  }, [formData, originalData]);

  // Calculate completion percentage (for existing courses, always 100% unless required fields are empty)
  const getCompletionPercentage = () => {
    const requiredFields = ['courseName', 'courseCode', 'academicYear', 'semester'];
    const filledFields = requiredFields.filter(field => formData[field].trim() !== '').length;
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  // Get changes summary for visual feedback
  const getChangesSummary = () => {
    const changes = [];
    Object.keys(formData).forEach(key => {
      if (formData[key] !== originalData[key]) {
        const fieldName = key === 'courseName' ? 'Course Name' :
                         key === 'courseCode' ? 'Course Code' :
                         key === 'academicYear' ? 'Academic Year' :
                         key === 'semester' ? 'Semester' :
                         key === 'description' ? 'Description' :
                         key === 'isActive' ? 'Status' : key;
        
        let oldValue = originalData[key];
        let newValue = formData[key];
        
        if (key === 'semester') {
          oldValue = getSemesterText(originalData[key]);
          newValue = getSemesterText(formData[key]);
        } else if (key === 'isActive') {
          oldValue = originalData[key] ? 'Active' : 'Inactive';
          newValue = formData[key] ? 'Active' : 'Inactive';
        }
        
        changes.push({ field: fieldName, old: oldValue, new: newValue });
      }
    });
    return changes;
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.courseName.trim()) {
      errors.courseName = 'Course name is required';
    }
    
    if (!formData.courseCode.trim()) {
      errors.courseCode = 'Course code is required';
    } else if (!/^[A-Z]{4}\d{5}$/.test(formData.courseCode.trim())) {
      errors.courseCode = 'Course code must be in format: COMP90082 (4 letters + 5 digits)';
    }
    
    if (!formData.academicYear) {
      errors.academicYear = 'Academic year is required';
    }
    
    if (!formData.semester) {
      errors.semester = 'Semester is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Ensure semester value remains as raw value (not formatted text)
      // This prevents any accidental conversion from "1" to "Semester 1"
      if (field === 'semester' && typeof value === 'string') {
        // Make sure we store the raw semester value
        if (value === 'Semester 1') newData.semester = '1';
        else if (value === 'Semester 2') newData.semester = '2'; 
        else if (value === 'Summer Term') newData.semester = 'summer';
        else newData.semester = value;
      }
      
      return newData;
    });
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Ensure semester is in the correct raw format before sending to backend
      let semesterValue = formData.semester;
      if (semesterValue === 'Semester 1') semesterValue = '1';
      else if (semesterValue === 'Semester 2') semesterValue = '2';
      else if (semesterValue === 'Summer Term') semesterValue = 'summer';
      
      // Prepare data for backend API according to CourseUpdateRequestDTO
      const updateData = {
        courseCode: formData.courseCode,
        courseName: formData.courseName,
        description: formData.description,
        academicYear: parseInt(formData.academicYear),
        semester: semesterValue,
        adminUserId: course.adminUserId || 1, // Use existing adminUserId or default
        status: formData.isActive ? 'active' : 'archived',
        isActive: formData.isActive
      };

      // Call backend API
      const response = await courseService.updateCourse(course.id, updateData);
      
      if (response.success) {
        // Create updated course object for UI update
        const updatedCourse = {
          ...course,
          name: formData.courseName,
          code: formData.courseCode,
          year: parseInt(formData.academicYear),
          semester: formData.semester,
          description: formData.description,
          isActive: formData.isActive,
          status: formData.isActive ? 'active' : 'archived',
          updatedAt: new Date().toISOString()
        };

        // Success! Call parent callback and show notification
        onCourseUpdated(updatedCourse);
        showNotification('success', 'Course updated successfully');
        
        // Reset state
        setOriginalData(formData);
        setHasChanges(false);
        setValidationErrors({});
      } else {
        throw new Error(response.message || 'Failed to update course');
      }
      
    } catch (error) {
      console.error('Failed to update course:', error);
      showNotification('error', error.message || 'Failed to update course');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close with unsaved changes warning
  const handleClose = () => {
    if (hasChanges && !isSubmitting) {
      setShowUnsavedWarning(true);
    } else {
      performClose();
    }
  };

  const performClose = () => {
    setFormData({
      courseName: '',
      courseCode: '',
      academicYear: '',
      semester: '',
      description: '',
      isActive: true
    });
    setOriginalData({});
    setValidationErrors({});
    setHasChanges(false);
    setShowUnsavedWarning(false);
    onClose();
  };

  const handleDiscardChanges = () => {
    setFormData(originalData);
    setHasChanges(false);
    setShowUnsavedWarning(false);
  };

  // Get semester display text
  const getSemesterText = (semesterValue) => {
    switch (semesterValue) {
      case '1': return 'Semester 1';
      case '2': return 'Semester 2';
      case 'summer': return 'Summer Term';
      default: return '-';
    }
  };

  if (!isOpen) return null;

  const completionPercentage = getCompletionPercentage();
  const changesSummary = getChangesSummary();

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
          {/* Header with Enhanced Visual Feedback */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-edit text-white"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit Course
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {course?.name} ({course?.code})
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {hasChanges && (
                <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">Unsaved changes</span>
                </div>
              )}
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Enhanced Progress Indicator */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Form Completion
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {completionPercentage}%
                  </span>
                  {completionPercentage === 100 && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-check text-white text-xs"></i>
                    </div>
                  )}
                </div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Changes Preview - Aha Moment! */}
            {hasChanges && changesSummary.length > 0 && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center mb-2">
                  <i className="fas fa-exclamation-triangle text-amber-600 dark:text-amber-400 mr-2"></i>
                  <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Pending Changes ({changesSummary.length})
                  </h4>
                </div>
                <div className="space-y-1">
                  {changesSummary.slice(0, 3).map((change, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-amber-700 dark:text-amber-300 font-medium">
                        {change.field}:
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                          {change.old || 'Empty'}
                        </span>
                        <i className="fas fa-arrow-right text-amber-600"></i>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                          {change.new || 'Empty'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {changesSummary.length > 3 && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 text-center pt-1">
                      +{changesSummary.length - 3} more changes
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-5">
              {/* Course Information Section */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg border border-blue-100 dark:border-blue-800 transition-all duration-300 hover:shadow-md">
                <div className="flex items-center mb-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mr-3">
                    <i className="fas fa-book-open text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">
                    Course Details
                  </h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="editCourseName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Course Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="editCourseName"
                      value={formData.courseName}
                      onChange={(e) => handleInputChange('courseName', e.target.value)}
                      className={`w-full rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border ${
                        validationErrors.courseName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 px-3 py-2 transition-all duration-200`}
                      placeholder="e.g. Software Project Management"
                      disabled={isSubmitting}
                    />
                    {validationErrors.courseName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 animate-slideIn">
                        {validationErrors.courseName}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label
                      htmlFor="editCourseCode"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Course Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="editCourseCode"
                      value={formData.courseCode}
                      onChange={(e) => handleInputChange('courseCode', e.target.value.toUpperCase())}
                      className={`w-full rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border ${
                        validationErrors.courseCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 px-3 py-2 transition-all duration-200`}
                      placeholder="e.g. COMP90082"
                      disabled={isSubmitting}
                    />
                    {validationErrors.courseCode && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 animate-slideIn">
                        {validationErrors.courseCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Period Section */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 rounded-lg border border-purple-100 dark:border-purple-800 transition-all duration-300 hover:shadow-md">
                <div className="flex items-center mb-3">
                  <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center mr-3">
                    <i className="fas fa-calendar-alt text-purple-600 dark:text-purple-400"></i>
                  </div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">
                    Academic Period
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="editAcademicYear"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Academic Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="editAcademicYear"
                      value={formData.academicYear}
                      onChange={(e) => handleInputChange('academicYear', e.target.value)}
                      className={`appearance-none w-full rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border ${
                        validationErrors.academicYear ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 px-3 py-2 transition-all duration-200`}
                      disabled={isSubmitting}
                    >
                      <option value="">Select Year</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                    {validationErrors.academicYear && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 animate-slideIn">
                        {validationErrors.academicYear}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label
                      htmlFor="editSemester"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Semester <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="editSemester"
                      value={formData.semester}
                      onChange={(e) => handleInputChange('semester', e.target.value)}
                      className={`appearance-none w-full rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border ${
                        validationErrors.semester ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 px-3 py-2 transition-all duration-200`}
                      disabled={isSubmitting}
                    >
                      <option value="">Select Semester</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="summer">Summer Term</option>
                    </select>
                    {validationErrors.semester && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 animate-slideIn">
                        {validationErrors.semester}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="p-4 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-lg border border-green-100 dark:border-green-800 transition-all duration-300 hover:shadow-md">
                <div className="flex items-center mb-3">
                  <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mr-3">
                    <i className="fas fa-info-circle text-green-600 dark:text-green-400"></i>
                  </div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">
                    Additional Information
                  </h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="editCourseDescription"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Description (Optional)
                    </label>
                    <textarea
                      id="editCourseDescription"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 px-3 py-2 transition-all duration-200"
                      placeholder="Enter a brief description of this course"
                      disabled={isSubmitting}
                    ></textarea>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editCourseActive"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 transition-all duration-200"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="editCourseActive"
                      className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                      Course is active
                    </label>
                  </div>
                </div>
              </div>

              {/* Course Summary */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Summary
                </h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Course:</span>
                    <span className="ml-1 font-medium text-gray-800 dark:text-gray-200">
                      {formData.courseName || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Code:</span>
                    <span className="ml-1 font-medium text-gray-800 dark:text-gray-200">
                      {formData.courseCode || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Year:</span>
                    <span className="ml-1 font-medium text-gray-800 dark:text-gray-200">
                      {formData.academicYear || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Semester:</span>
                    <span className="ml-1 font-medium text-gray-800 dark:text-gray-200">
                      {getSemesterText(formData.semester)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="mt-6 flex justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                <span className="text-red-500">*</span> Required fields
              </div>
              <div className="flex space-x-3">
                {hasChanges && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDiscardChanges}
                    disabled={isSubmitting}
                    className="text-amber-600 border-amber-300 hover:bg-amber-50"
                  >
                    <i className="fas fa-undo mr-2"></i>
                    Discard Changes
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !hasChanges || completionPercentage < 100}
                  className={`${
                    hasChanges && completionPercentage === 100
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105'
                      : 'bg-gray-400'
                  } text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200`}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-1.5"></i> Updating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-1.5"></i> 
                      {hasChanges ? `Save Changes (${changesSummary.length})` : 'Save Changes'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 transform transition-all duration-300 scale-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-exclamation-triangle text-amber-600 dark:text-amber-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Unsaved Changes
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have {changesSummary.length} unsaved change{changesSummary.length !== 1 ? 's' : ''}. 
              Are you sure you want to leave without saving?
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowUnsavedWarning(false)}
              >
                Keep Editing
              </Button>
              <Button
                onClick={performClose}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}