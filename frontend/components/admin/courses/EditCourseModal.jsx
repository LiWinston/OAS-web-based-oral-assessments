'use client';

import { useState, useEffect } from 'react';

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


  // Populate form when course data changes
  useEffect(() => {
    if (isOpen && course) {
      // Convert semester to raw value if it's formatted text
      let semesterValue = course.semester || '';
      if (semesterValue === 'Semester 1') semesterValue = '1';
      else if (semesterValue === 'Semester 2') semesterValue = '2';
      else if (semesterValue === 'Summer Term') semesterValue = 'summer';
      
      const initialData = {
        courseName: course.name || course.courseName || '',
        courseCode: course.code || course.courseCode || '',
        academicYear: course.year?.toString() || course.academicYear?.toString() || '',
        semester: semesterValue,
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
      const confirmClose = confirm('You have unsaved changes. Are you sure you want to close?');
      if (confirmClose) {
        performClose();
      }
    } else {
      performClose();
    }
  };

  const performClose = () => {
    onClose();
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Course
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Update course information
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <span className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
                  <span className="w-2 h-2 bg-amber-600 dark:text-amber-400 rounded-full mr-2 animate-pulse"></span>
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>





            <div className="space-y-5">
              {/* Course Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-book-open text-white"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Course Information
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
                      className={`
                        w-full rounded-lg px-4 py-2.5 text-sm
                        bg-white dark:bg-gray-700 
                        border ${validationErrors.courseName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                        transition-all duration-200
                      `}
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
                      className={`
                        w-full rounded-lg px-4 py-2.5 text-sm
                        bg-white dark:bg-gray-700 
                        border ${validationErrors.courseCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                        transition-all duration-200
                      `}
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

              {/* Academic Period */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-calendar-alt text-white"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
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
                      className={`
                        appearance-none w-full rounded-lg px-4 py-2.5 text-sm
                        bg-white dark:bg-gray-700 
                        border ${validationErrors.academicYear ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                        transition-all duration-200
                      `}
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
                      className={`
                        appearance-none w-full rounded-lg px-4 py-2.5 text-sm
                        bg-white dark:bg-gray-700 
                        border ${validationErrors.semester ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                        transition-all duration-200
                      `}
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

              {/* Additional Information */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border border-green-200 dark:border-green-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-info-circle text-white"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
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
                      className={`
                        w-full rounded-lg px-4 py-2.5 text-sm
                        bg-white dark:bg-gray-700 
                        border border-gray-300 dark:border-gray-600
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                        transition-all duration-200
                      `}
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

            {/* Change Summary */}
            {hasChanges && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-blue-600 mt-0.5 mr-3"></i>
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Pending Changes:
                    </p>
                    <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
                      {formData.courseName !== originalData.courseName && (
                        <li>Course Name: {originalData.courseName || 'Empty'} → {formData.courseName || 'Empty'}</li>
                      )}
                      {formData.courseCode !== originalData.courseCode && (
                        <li>Course Code: {originalData.courseCode || 'Empty'} → {formData.courseCode || 'Empty'}</li>
                      )}
                      {formData.academicYear !== originalData.academicYear && (
                        <li>Academic Year: {originalData.academicYear || 'Empty'} → {formData.academicYear || 'Empty'}</li>
                      )}
                      {formData.semester !== originalData.semester && (
                        <li>Semester: {getSemesterText(originalData.semester) || 'Empty'} → {getSemesterText(formData.semester) || 'Empty'}</li>
                      )}
                      {formData.description !== originalData.description && (
                        <li>Description: {originalData.description || 'Empty'} → {formData.description || 'Empty'}</li>
                      )}
                      {formData.isActive !== originalData.isActive && (
                        <li>Status: {originalData.isActive ? 'Active' : 'Inactive'} → {formData.isActive ? 'Active' : 'Inactive'}</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasChanges}
              className={`
                px-6 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200
                ${hasChanges 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105' 
                  : 'bg-gray-400 cursor-not-allowed'
                }
                disabled:opacity-50
              `}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Updating...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Update Course
                </>
              )}
            </button>
          </div>
        </div>
      </div>


    </>
  );
}