'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { courseService } from '../../../services/courseService';
import { useAuthStore } from '../../../store/authStore';

export function CourseCreationModal({ isOpen, onClose, onCourseCreated }) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    academicYear: '',
    semester: '',
    description: '',
    isActive: true
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCourse, setCreatedCourse] = useState(null);
  const [apiError, setApiError] = useState('');

  // Smart defaults - set current year and upcoming semester
  useEffect(() => {
    if (isOpen) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1; // 1-12
      
      // Determine likely semester based on current month
      let defaultSemester = '';
      if (currentMonth >= 1 && currentMonth <= 6) {
        defaultSemester = '1'; // First half of year, likely planning for Semester 1
      } else {
        defaultSemester = '2'; // Second half, likely planning for Semester 2 or next year
      }

      setFormData(prev => ({
        ...prev,
        academicYear: currentYear.toString(),
        semester: defaultSemester
      }));
    }
  }, [isOpen]);

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    const requiredFields = ['courseName', 'courseCode', 'academicYear', 'semester'];
    const filledFields = requiredFields.filter(field => formData[field].trim() !== '').length;
    return Math.round((filledFields / requiredFields.length) * 100);
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
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
    setApiError(''); // Clear previous errors
    
    try {
      // Call real course service API
      const result = await courseService.createCourse({
        courseCode: formData.courseCode,
        courseName: formData.courseName,
        description: formData.description || '',
        academicYear: parseInt(formData.academicYear),
        semester: formData.semester,
        adminUserId: user?.userId || 1, // Get from user context
        status: formData.isActive ? 'active' : 'archived'
      });
      
      if (result.success) {
        // Success handling
        setCreatedCourse(result.data);
        setShowSuccess(true);
        
        setTimeout(() => {
          onCourseCreated(result.data);
          
          // Reset form
          setFormData({
            courseName: '',
            courseCode: '',
            academicYear: '',
            semester: '',
            description: '',
            isActive: true
          });
          setValidationErrors({});
          setShowSuccess(false);
          setCreatedCourse(null);
        }, 3000);
      } else {
        // API error response
        setApiError(result.message || 'Failed to create course');
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      setApiError(error.message || 'Network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        courseName: '',
        courseCode: '',
        academicYear: '',
        semester: '',
        description: '',
        isActive: true
      });
      setValidationErrors({});
      onClose();
    }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Create New Course
          </h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Form Completion
              </span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {completionPercentage}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out progress-bar-glow"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Error Display */}
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <i className="fas fa-exclamation-circle text-red-600 dark:text-red-400 mr-2"></i>
                <span className="text-sm text-red-700 dark:text-red-300">{apiError}</span>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* Course Information Section */}
            <div className="form-section p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg border border-blue-100 dark:border-blue-800">
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
                    htmlFor="courseName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="courseName"
                    value={formData.courseName}
                    onChange={(e) => handleInputChange('courseName', e.target.value)}
                    className={`w-full rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border ${
                      validationErrors.courseName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 px-3 py-2`}
                    placeholder="e.g. Software Project Management"
                    disabled={isSubmitting}
                  />
                  {validationErrors.courseName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.courseName}
                    </p>
                  )}
                </div>
                
                <div>
                  <label
                    htmlFor="courseCode"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="courseCode"
                    value={formData.courseCode}
                    onChange={(e) => handleInputChange('courseCode', e.target.value.toUpperCase())}
                    className={`w-full rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border ${
                      validationErrors.courseCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 px-3 py-2`}
                    placeholder="e.g. COMP90082"
                    disabled={isSubmitting}
                  />
                  {validationErrors.courseCode && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.courseCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Period Section */}
            <div className="form-section p-4 bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 rounded-lg border border-purple-100 dark:border-purple-800">
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
                    htmlFor="academicYear"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="academicYear"
                    value={formData.academicYear}
                    onChange={(e) => handleInputChange('academicYear', e.target.value)}
                    className={`appearance-none w-full rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border ${
                      validationErrors.academicYear ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 px-3 py-2`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select Year</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                  </select>
                  {validationErrors.academicYear && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.academicYear}
                    </p>
                  )}
                </div>
                
                <div>
                  <label
                    htmlFor="semester"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="semester"
                    value={formData.semester}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                    className={`appearance-none w-full rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border ${
                      validationErrors.semester ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 px-3 py-2`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select Semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="summer">Summer Term</option>
                  </select>
                  {validationErrors.semester && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.semester}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="form-section p-4 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-lg border border-green-100 dark:border-green-800">
              <div className="flex items-center mb-3">
                <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mr-3">
                  <i className="fas fa-info-circle text-green-600 dark:text-green-400"></i>
                </div>
                <h4 className="text-base font-medium text-gray-900 dark:text-white">
                  Additional Information
                </h4>
              </div>

              <div>
                <label
                  htmlFor="courseDescription"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="courseDescription"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 px-3 py-2"
                  placeholder="Enter a brief description of this course"
                  disabled={isSubmitting}
                ></textarea>
              </div>

              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="courseActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="courseActive"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Set as active course
                </label>
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

          {/* Footer */}
          <div className="mt-6 flex justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400 italic">
              <span className="text-red-500">*</span> Required fields
            </div>
            <div className="flex space-x-3">
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
                disabled={isSubmitting || completionPercentage < 100}
                className="btn-magic bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center disabled:opacity-50 transform hover:scale-105 transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-1.5"></i> Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus mr-1.5"></i> Create Course
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* What's Next Information */}
          <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start">
              <div className="mr-3 text-blue-500 mt-0.5">
                <i className="fas fa-info-circle"></i>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <strong className="font-medium text-gray-700 dark:text-gray-300">
                  What's next?
                </strong>
                <p className="mt-1">
                  After creating a course, you'll be able to configure assignments (Individual, Group, or Mixed), 
                  set up marking rubrics, upload student data for each assignment, and manage assessment schedules.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Success Celebration Modal - Aha Moment! */}
      {showSuccess && createdCourse && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full mx-4 p-8 text-center transform animate-bounce">
            {/* Confetti Effect */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                />
              ))}
            </div>
            
            {/* Success Content */}
            <div className="relative z-10">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <i className="fas fa-check text-green-600 dark:text-green-400 text-2xl"></i>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🎉 Course Created!
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                <strong>{createdCourse.name}</strong> has been successfully created.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  What's Next?
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 text-left space-y-1">
                  <li>• Configure assignments for this course</li>
                  <li>• Upload student data via CSV</li>
                  <li>• Set up marking rubrics</li>
                  <li>• Define time slots for assessments</li>
                </ul>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Redirecting in a moment...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}