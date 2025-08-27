'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../../ui/button';
import { useNotification } from '../../../hooks/useNotification';

export function AssignmentCreationModal({ 
  isOpen, 
  onClose, 
  onAssignmentCreated, 
  courseId,
  courseName = 'Software Project Management',
  courseCode = 'COMP90082',
  courseSemester = '2025 Semester 2',
  // API functions passed from parent
  createAssignment,
  previewStudentCsv,
  previewExaminerCsv,
  uploadStudentCsv,
  uploadExaminerCsv
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    courseId,
    name: '',
    description: '',
    type: 'individual',
    startDate: '',
    endDate: '',
    weight: 25
  });

  // CSV upload data - independent structure
  const [csvData, setCsvData] = useState({
    student: {
      file: null,
      type: 'student',
      previewData: null
    },
    examiner: {
      file: null,
      previewData: null
    }
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [csvUploadStatus, setCsvUploadStatus] = useState({
    student: { uploading: false, error: null },
    examiner: { uploading: false, error: null }
  });
  const fileInputRef = useRef(null);
  const { showNotification } = useNotification();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        courseId,
        name: '',
        description: '',
        type: 'individual',
        startDate: '',
        endDate: '',
        weight: 25
      });
      setCsvData({
        student: { file: null, type: 'student', previewData: null },
        examiner: { file: null, previewData: null }
      });
      setValidationErrors({});
      setShowSuccess(false);
    }
  }, [isOpen, courseId]);

  // Update CSV type when assignment type changes
  useEffect(() => {
    if (formData.type === 'group' || formData.type === 'mixed') {
      setCsvData(prev => ({
        ...prev,
        student: { ...prev.student, type: 'group' }
      }));
    } else {
      setCsvData(prev => ({
        ...prev,
        student: { ...prev.student, type: 'student' }
      }));
    }
  }, [formData.type]);

  // Calculate step completion
  const getStepCompletion = () => {
    const completion = {
      1: false,
      2: false,
      3: false
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

    switch (stepNumber) {
      case 1:
        if (!formData.name.trim()) {
          errors.name = 'Assignment name is required';
        }
        if (!formData.startDate) {
          errors.startDate = 'Start date is required';
        }
        if (!formData.endDate) {
          errors.endDate = 'End date is required';
        }
        if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
          errors.endDate = 'End date must be after start date';
        }
        if (!formData.weight || formData.weight === '') {
          errors.weight = 'Weight is required';
        } else if (formData.weight < 0 || formData.weight > 100) {
          errors.weight = 'Weight must be between 0 and 100';
        }
        break;
      case 2:
        // CSV is optional
        break;
      case 3:
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

  // Handle file select
  const handleFileSelect = async (file) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showNotification('error', 'Please upload a CSV file');
      return;
    }

    setCsvData(prev => ({
      ...prev,
      student: { ...prev.student, file: file }
    }));

    setCsvUploadStatus(prev => ({
      ...prev,
      student: { uploading: false, error: null }
    }));
  };

  // Handle examiner file select
  const handleExaminerFileSelect = async (file) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showNotification('error', 'Please upload a CSV file');
      return;
    }

    setCsvData(prev => ({
      ...prev,
      examiner: { ...prev.examiner, file: file }
    }));

    setCsvUploadStatus(prev => ({
      ...prev,
      examiner: { uploading: false, error: null }
    }));
  };

  // Handle CSV upload
  const handleCsvPreview = async (type) => {
    if (type === "student") {
      if (!csvData.student.file) {
        showNotification('error', 'Please select a CSV file first');
        return;
      }

      setCsvUploadStatus(prev => ({
        ...prev,
        student: { ...prev.student, uploading: true, error: null }
      }));

      try {
        // Use parent's preview function with simplified parameters
        const result = await previewStudentCsv(csvData.student.file, csvData.student.type);

        setCsvUploadStatus(prev => ({
          ...prev,
          student: { ...prev.student, uploading: false, error: null },
        }));

        // Store preview data
        setCsvData(prev => ({
          ...prev,
          student: { ...prev.student, previewData: result.data }
        }));

        showNotification('success', 'CSV file validated successfully');
      } catch (error) {
        console.error("CSV upload error:", error);
        setCsvUploadStatus(prev => ({
          ...prev,
          student: { ...prev.student, uploading: false, error: error.message },
        }));
        showNotification('error', error.message);
      }
    } else if (type === "examiner") {
      if (!csvData.examiner.file) {
        showNotification('error', 'Please select a CSV file first');
        return;
      }

      setCsvUploadStatus(prev => ({
        ...prev,
        examiner: { ...prev.examiner, uploading: true, error: null }
      }));

      try {
        // Use parent's preview function with simplified parameters
        const result = await previewExaminerCsv(csvData.examiner.file);

        setCsvUploadStatus(prev => ({
          ...prev,
          examiner: { ...prev.examiner, uploading: false, error: null },
        }));

        // Store preview data
        setCsvData(prev => ({
          ...prev,
          examiner: { ...prev.examiner, previewData: result.data }
        }));

        showNotification('success', 'Examiner CSV file validated successfully');
      } catch (error) {
        console.error("Examiner CSV upload error:", error);
        setCsvUploadStatus(prev => ({
          ...prev,
          examiner: { ...prev.examiner, uploading: false, error: error.message },
        }));
        showNotification('error', error.message);
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
    if (!validateStep(1)) {
      setStep(1);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create assignment using parent's function
      const result = await createAssignment(formData, isDraft);

      if (result.success) {
        // If not draft, upload CSV data
        if (!isDraft) {
          try {
            // Upload student CSV data
            if (csvData.student.file) {
              const uploadResult = await uploadStudentCsv(csvData.student.file, csvData.student.type);
              console.log('Student CSV uploaded successfully');
            }

            // Upload examiner CSV data
            if (csvData.examiner.file) {
              const uploadResult = await uploadExaminerCsv(csvData.examiner.file);
              console.log('Examiner CSV uploaded successfully');
            }
          } catch (uploadError) {
            console.error('CSV upload error:', uploadError);
            showNotification('warning', 'Assignment created but CSV upload failed. You can upload CSV data later.');
          }
        }

        setShowSuccess(true);
        
        // Celebration animation
        setTimeout(() => {
          onAssignmentCreated(result.data);
        }, 2500);
      }
    } catch (error) {
      showNotification('error', 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get assignment type icon and color
  const getTypeStyles = (type) => {
    switch (type) {
      case 'individual':
        return {
          icon: 'fa-user',
          bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
          borderColor: 'border-indigo-200 dark:border-indigo-800',
          textColor: 'text-indigo-700 dark:text-indigo-300',
          iconColor: 'text-indigo-500',
          activeBg: 'bg-indigo-100 dark:bg-indigo-800',
          activeText: 'text-indigo-800 dark:text-indigo-200'
        };
      case 'group':
        return {
          icon: 'fa-users',
          bgColor: 'bg-pink-50 dark:bg-pink-900/30',
          borderColor: 'border-pink-200 dark:border-pink-800',
          textColor: 'text-pink-700 dark:text-pink-300',
          iconColor: 'text-pink-500',
          activeBg: 'bg-pink-100 dark:bg-pink-800',
          activeText: 'text-pink-800 dark:text-pink-200'
        };
      case 'mixed':
        return {
          icon: 'fa-layer-group',
          bgColor: 'bg-teal-50 dark:bg-teal-900/30',
          borderColor: 'border-teal-200 dark:border-teal-800',
          textColor: 'text-teal-700 dark:text-teal-300',
          iconColor: 'text-teal-500',
          activeBg: 'bg-teal-100 dark:bg-teal-800',
          activeText: 'text-teal-800 dark:text-teal-200'
        };
    }
  };

  if (!isOpen) return null;

  const stepCompletion = getStepCompletion();

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
              {courseName} ({courseCode}) • {courseSemester}
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
                  {index < 2 && (
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
                    Details & Type
                  </span>
                </div>
                
                {/* Spacer for first line */}
                <div style={{ width: '152px' }}></div>
                
                {/* Second label */}
                <div className="w-10 flex justify-center">
                  <span className={`text-xs whitespace-nowrap ${step >= 2 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    Participants
                  </span>
                </div>
                
                {/* Spacer for second line */}
                <div style={{ width: '152px' }}></div>
                
                {/* Third label */}
                <div className="w-10 flex justify-center">
                  <span className={`text-xs whitespace-nowrap ${step >= 3 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    Configure
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
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
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`
                        w-full rounded-lg px-4 py-2.5 text-sm
                        bg-white dark:bg-gray-700 
                        border ${validationErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                        transition-all duration-200
                      `}
                      placeholder="e.g., Mid-Semester Project Presentation"
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
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      placeholder="Provide a brief description of the assignment..."
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
                  {['individual', 'group', 'mixed'].map((type) => {
                    const styles = getTypeStyles(type);
                    return (
                      <button
                        key={type}
                        onClick={() => handleInputChange('type', type)}
                        className={`
                          relative p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-105
                          ${formData.type === type 
                            ? `${styles.activeBg} ${styles.borderColor} ring-2 ring-offset-2 ring-blue-500 shadow-lg` 
                            : `${styles.bgColor} ${styles.borderColor} hover:shadow-md`
                          }
                        `}
                      >
                        <div className="flex flex-col items-center">
                          <i className={`fas ${styles.icon} text-2xl ${styles.iconColor} mb-2`}></i>
                          <span className={`font-medium capitalize ${formData.type === type ? styles.activeText : styles.textColor}`}>
                            {type}
                          </span>
                          <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                            {type === 'individual' && 'Each student assessed separately'}
                            {type === 'group' && 'Students assessed as teams'}
                            {type === 'mixed' && 'Group + individual components'}
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
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className={`
                          w-full rounded-lg pl-10 pr-4 py-2.5 text-sm
                          bg-white dark:bg-gray-700 
                          border ${validationErrors.startDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                          transition-all duration-200
                        `}
                      />
                      <i className="fas fa-calendar-day absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    {validationErrors.startDate && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validationErrors.startDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        className={`
                          w-full rounded-lg pl-10 pr-4 py-2.5 text-sm
                          bg-white dark:bg-gray-700 
                          border ${validationErrors.endDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                          transition-all duration-200
                        `}
                      />
                      <i className="fas fa-calendar-check absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
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
                          if (value === '') {
                            handleInputChange('weight', '');
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue)) {
                              handleInputChange('weight', numValue);
                            }
                          }
                        }}
                        min="0"
                        max="100"
                        className={`
                          w-full rounded-lg px-4 py-2.5 pr-12 text-sm
                          bg-white dark:bg-gray-700 
                          border ${validationErrors.weight ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
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
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                          style={{ width: `${formData.weight === '' || !formData.weight ? 0 : formData.weight}%` }}
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
                    Upload Student/Group Data
                  </h4>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Upload a CSV file with student information. This step is optional for initial setup. The CSV data will be uploaded after the assignment is created.
                </p>

{!csvData.student.previewData ? (
                  !csvData.student.file ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                        ${isDragging 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
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
                          const fileInput = document.getElementById('student-file-input');
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
                              {csvData.student.file ? csvData.student.file.name : ''}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              File selected, ready to upload
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setCsvData(prev => ({
                              ...prev,
                              student: { file: null, type: prev.student.type, previewData: null }
                            }));
                            setCsvUploadStatus(prev => ({
                              ...prev,
                              student: { uploading: false, error: null }
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
                      <div className="text-sm text-green-600 dark:text-green-400">
                        <span className="mr-3">Total: {csvData.student.previewData?.totalCount || 0}</span>
                        <span className="mr-3 text-blue-600">New: {csvData.student.previewData?.newCount || 0}</span>
                        <span className="text-orange-600">Existing: {csvData.student.previewData?.existingCount || 0}</span>
                      </div>
                    </div>

                    {/* Statistics Summary */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {csvData.student.previewData?.newCount || 0}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">New Students</div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                          {csvData.student.previewData?.existingCount || 0}
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400">Existing Students</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          {csvData.student.previewData?.totalCount || 0}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">Total</div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setCsvData(prev => ({
                          ...prev,
                          student: { file: null, type: prev.student.type, previewData: null }
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
                      <p className="font-medium mb-1">CSV Format Requirements:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Individual: StudentID, Name, Email</li>
                        <li>Group: StudentID, Name, Email, GroupID, GroupName</li>
                        <li>Mixed: Include both individual and group columns</li>
                      </ul>
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
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Upload a CSV file with examiner information. This step is optional for initial setup. The CSV data will be uploaded after the assignment is created.
                </p>

{!csvData.examiner.previewData ? (
                  !csvData.examiner.file ? (
                    <div
                      onDragOver={handleExaminerDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleExaminerDrop}
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                        ${isDragging 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }
                      `}
                    >
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleExaminerFileSelect(e.target.files[0])}
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
                          const fileInput = document.getElementById('examiner-file-input');
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
                              {csvData.examiner.file ? csvData.examiner.file.name : ''}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              File selected, ready to upload
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setCsvData(prev => ({
                              ...prev,
                              examiner: { file: null, previewData: null }
                            }));
                            setCsvUploadStatus(prev => ({
                              ...prev,
                              examiner: { uploading: false, error: null }
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
                      <div className="text-sm text-green-600 dark:text-green-400">
                        <span className="mr-3">Total: {csvData.examiner.previewData?.totalCount || 0}</span>
                        <span className="mr-3 text-blue-600">New: {csvData.examiner.previewData?.newCount || 0}</span>
                        <span className="text-orange-600">Existing: {csvData.examiner.previewData?.existingCount || 0}</span>
                      </div>
                    </div>

                    {/* Statistics Summary for Examiners */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {csvData.examiner.previewData?.newCount || 0}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">New Examiners</div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                          {csvData.examiner.previewData?.existingCount || 0}
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400">Existing Examiners</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          {csvData.examiner.previewData?.totalCount || 0}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">Total</div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setCsvData(prev => ({
                          ...prev,
                          examiner: { file: null, previewData: null }
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
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>ExaminerID, Name, Email, Department</li>
                      </ul>
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
                    <span className="text-sm text-gray-600 dark:text-gray-400">Name</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium capitalize
                      ${formData.type === 'individual' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : ''}
                      ${formData.type === 'group' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300' : ''}
                      ${formData.type === 'mixed' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' : ''}
                    `}>
                      {formData.type}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Period</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.startDate} to {formData.endDate}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Weight</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.weight}%</span>
                  </div>
                  
                  {csvData.student.file && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Student CSV</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {csvData.student.file.name}
                      </span>
                    </div>
                  )}
                  
                  {csvData.examiner.file && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Examiner CSV</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {csvData.examiner.file.name}
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
                  After creating the assignment, you can configure these components:
                </p>

                <div className="space-y-3">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-amber-400 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                        <i className="fas fa-clipboard-list text-amber-600"></i>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">Configure Rubric</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Set up assessment criteria</p>
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-gray-400 group-hover:translate-x-1 transition-transform"></i>
                  </button>

                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-cyan-400 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                        <i className="fas fa-calendar-plus text-cyan-600"></i>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">Set Up Time Slots</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Schedule assessment sessions</p>
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-gray-400 group-hover:translate-x-1 transition-transform"></i>
                  </button>

                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-lime-400 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-lime-100 dark:bg-lime-900/50 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                        <i className="fas fa-user-shield text-lime-600"></i>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">Assign Examiners</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Manage examiner assignments</p>
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
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center animate-bounceIn">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <i className="fas fa-check text-3xl text-green-600 animate-scaleIn"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Assignment Created!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload completed, ready for assignment creation
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
                disabled={isSubmitting}
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