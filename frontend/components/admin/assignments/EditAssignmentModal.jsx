'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { useNotification } from '../../../hooks/useNotification';
import { assignmentService } from '../../../services/assignmentService';

export function EditAssignmentModal({ 
  isOpen, 
  onClose, 
  onAssignmentUpdated, 
  assignment 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'individual',
    startDate: '',
    endDate: '',
    weight: 25
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { showNotification } = useNotification();

  // Helper function to convert datetime to date format for HTML date input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // If datetime format (e.g., "2025-08-20T00:00:00"), extract date part
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    // If already in YYYY-MM-DD format, return as is
    return dateString;
  };

  // Initialize form with assignment data
  useEffect(() => {
    if (assignment && isOpen) {
      setFormData({
        name: assignment.name || '',
        description: assignment.description || '',
        type: assignment.type || 'individual',
        startDate: formatDateForInput(assignment.startDate),
        endDate: formatDateForInput(assignment.endDate),
        weight: assignment.weight || 25
      });
      setHasChanges(false);
      setValidationErrors({});
    }
  }, [assignment, isOpen]);

  // Track changes
  useEffect(() => {
    if (assignment) {
      const changed = 
        formData.name !== assignment.name ||
        formData.description !== assignment.description ||
        formData.type !== assignment.type ||
        formData.startDate !== formatDateForInput(assignment.startDate) ||
        formData.endDate !== formatDateForInput(assignment.endDate) ||
        formData.weight !== assignment.weight;
      setHasChanges(changed);
    }
  }, [formData, assignment]);

  // Validate form
  const validateForm = () => {
    const errors = {};
    
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
    
    try {
      const updateData = {
        id: assignment.id,
        subjectId: assignment.subjectId,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        weight: Number(formData.weight),
      };
      
      const result = await assignmentService.updateAssignment(assignment.id, updateData);
      
      if (result.success) {
        onAssignmentUpdated(result.data);
      } else {
        // Handle backend validation errors
        const errorMessage = result.data || result.message || 'Failed to update assignment';
        showNotification('error', errorMessage);
      }
    } catch (error) {
      showNotification('error', 'Failed to update assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      if (hasChanges) {
        const confirmClose = confirm('You have unsaved changes. Are you sure you want to close?');
        if (!confirmClose) return;
      }
      onClose();
    }
  };

  // Get assignment type styles
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

  if (!isOpen || !assignment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit Assignment
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Update assignment details
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <span className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
                <span className="w-2 h-2 bg-amber-600 dark:bg-amber-400 rounded-full mr-2 animate-pulse"></span>
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
          <div className="space-y-6">
            {/* Assignment Details */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
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

            {/* Assignment Type */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5 border border-purple-200 dark:border-purple-800">
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
                      type="button"
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

              {assignment.type !== formData.type && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start">
                    <i className="fas fa-exclamation-triangle text-amber-600 mt-0.5 mr-2"></i>
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      Changing assignment type may affect existing student groups and booking configurations.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Scheduling & Grading */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border border-green-200 dark:border-green-800">
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
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className={`
                        w-full rounded-lg pl-10 pr-4 py-2.5 text-sm
                        bg-white dark:bg-gray-700 
                        border ${validationErrors.startDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
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
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className={`
                        w-full rounded-lg pl-10 pr-4 py-2.5 text-sm
                        bg-white dark:bg-gray-700 
                        border ${validationErrors.endDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
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
                      {formData.name !== assignment.name && (
                        <li>Name: {assignment.name} → {formData.name}</li>
                      )}
                      {formData.type !== assignment.type && (
                        <li>Type: {assignment.type} → {formData.type}</li>
                      )}
                      {formData.startDate !== formatDateForInput(assignment.startDate) && (
                        <li>Start Date: {formatDateForInput(assignment.startDate)} → {formData.startDate}</li>
                      )}
                      {formData.endDate !== formatDateForInput(assignment.endDate) && (
                        <li>End Date: {formatDateForInput(assignment.endDate)} → {formData.endDate}</li>
                      )}
                      {formData.weight !== assignment.weight && (
                        <li>Weight: {assignment.weight}% → {formData.weight}%</li>
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
                Update Assignment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}