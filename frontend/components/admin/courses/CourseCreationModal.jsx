'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { courseService } from '../../../services/courseService';
import { useAuthStore } from '../../../store/authStore';

export function CourseCreationModal({ isOpen, onClose, onCourseCreated }) {
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
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

  // Smart defaults - set current year and upcoming semester
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData(prev => ({
        ...prev,
        courseName: '',
        courseCode: '',
        academicYear: '',
        semester: '',
        description: '',
        isActive: true
      }));
    }
  }, [isOpen]);

  // Calculate step completion
  const getStepCompletion = () => {
    const completion = {
      1: false,
      2: false
    };

    // Simple logic: current step and all previous steps are complete
    for (let i = 1; i <= 2; i++) {
      completion[i] = step > i;
    }

    return completion;
  };

  // Validate current step
  const validateStep = (stepNumber) => {
    const errors = {};

    switch (stepNumber) {
      case 1:
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
        break;
      case 2:
        // Final validation done on submit
        break;
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
  const handleSubmit = async () => {
    if (!validateStep(1)) {
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    
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
        }, 2500);
      }
    } catch (error) {
      console.error('Failed to create course:', error);
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

  const stepCompletion = getStepCompletion();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Create New Course
          </h3>
          <button
            onClick={handleClose}
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
              {[1, 2].map((num, index) => (
                <div key={num} className="flex items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-300
                      ${step >= num 
                        ? 'bg-blue-600 text-white scale-110 shadow-lg' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }
                      ${stepCompletion[num] && step !== num ? 'ring-2 ring-green-500 ring-offset-2' : ''}
                    `}
                  >
                    {stepCompletion[num] ? (
                      <i className="fas fa-check"></i>
                    ) : (
                      num
                    )}
                  </div>
                  {index < 1 && (
                    <div 
                      className={`
                        h-1 w-32 mx-3 rounded-full transition-all duration-500
                        ${step > num 
                          ? 'bg-blue-600' 
                          : 'bg-gray-200 dark:bg-gray-700'
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
                  <span className={`text-xs whitespace-nowrap ${step >= 1 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    Course Details
                  </span>
                </div>
                
                {/* Spacer for line */}
                <div style={{ width: '152px' }}></div>
                
                {/* Second label */}
                <div className="w-10 flex justify-center">
                  <span className={`text-xs whitespace-nowrap ${step >= 2 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    Summary
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto" style={{ height: '600px', maxHeight: 'calc(90vh - 280px)' }}>
          {/* Step 1: Course Details */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Course Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Course Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
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
                    />
                    {validationErrors.courseName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validationErrors.courseName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Course Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
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
                    />
                    {validationErrors.courseCode && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validationErrors.courseCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Period */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Academic Year <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.academicYear}
                        onChange={(e) => handleInputChange('academicYear', e.target.value)}
                        className={`
                          appearance-none w-full rounded-lg pl-4 pr-10 py-2.5 text-sm
                          bg-white dark:bg-gray-700 ${!formData.academicYear ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}
                          border ${validationErrors.academicYear ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                          transition-all duration-200
                        `}
                      >
                        <option value="">Select Year</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <i className="fas fa-chevron-down text-xs"></i>
                      </div>
                    </div>
                    {validationErrors.academicYear && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validationErrors.academicYear}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Semester <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.semester}
                        onChange={(e) => handleInputChange('semester', e.target.value)}
                        className={`
                          appearance-none w-full rounded-lg pl-4 pr-10 py-2.5 text-sm
                          bg-white dark:bg-gray-700 ${!formData.semester ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}
                          border ${validationErrors.semester ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                          transition-all duration-200
                        `}
                      >
                        <option value="">Select Semester</option>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                        <option value="summer">Summer Term</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <i className="fas fa-chevron-down text-xs"></i>
                      </div>
                    </div>
                    {validationErrors.semester && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validationErrors.semester}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-info-circle text-white"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Additional Information
                  </h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder="Provide a brief description of this course..."
                  />
                </div>

                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Set as active course
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Summary
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Course Name</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.courseName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Course Code</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.courseCode}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Academic Year</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.academicYear}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Semester</span>
                    <span className="font-medium text-gray-900 dark:text-white">{getSemesterText(formData.semester)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${formData.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="py-2">
                    <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Description</span>
                    {formData.description ? (
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formData.description}
                      </p>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 italic">
                        No Description
                      </p>
                    )}
                  </div>
                </div>
              </div>


            </div>
          )}

          {/* Success Animation */}
          {showSuccess && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center animate-bounceIn">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <i className="fas fa-check text-3xl text-green-600 animate-scaleIn"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Course Created!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can now start adding assignments
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
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
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
          </div>

          <div>
            {step < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                Next
                <i className="fas fa-arrow-right ml-2"></i>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
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
                    Create Course
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