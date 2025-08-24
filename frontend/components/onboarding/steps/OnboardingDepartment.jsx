'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Building } from 'lucide-react';
import OnboardingLayout from '../OnboardingLayout';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { getDepartments } from '../../../services/onboardingService';

export default function OnboardingDepartment({ 
  data, 
  onUpdate, 
  onNext, 
  onPrev 
}) {
  const [formData, setFormData] = useState({
    department: data.department || ''
  });
  
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const deptList = await getDepartments();
      setDepartments(deptList);
    } catch (error) {
      console.error('Failed to load departments:', error);
      // Use fallback list
      setDepartments([
        'Computer Science',
        'Engineering',
        'Mathematics',
        'Physics',
        'Biology',
        'Chemistry',
        'Business',
        'Medicine',
        'Law',
        'Arts',
        'Education',
        'Psychology'
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.department) {
      newErrors.department = 'Please select a department';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onUpdate(formData);
      onNext();
    }
  };

  const handleDepartmentSelect = (dept) => {
    setFormData({ department: dept });
    setErrors({});
  };

  return (
    <OnboardingLayout step={1} stepLabel="Department" role="COURSE_ADMIN" maxSteps={4}>
      <div className="w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <Building className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 
            className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white mb-2"
            style={{ fontWeight: 400 }}
          >
            Select Your Department
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose the department you'll be managing courses for
          </p>
        </div>
        
        <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
          <div>
            <Label className="block text-sm text-gray-600 dark:text-gray-400 mb-3">
              Department
            </Label>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading departments...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => handleDepartmentSelect(dept)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.department === dept
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            )}
            
            {errors.department && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                {errors.department}
              </p>
            )}
          </div>
          
          {/* Selected Department Display */}
          {formData.department && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Selected:</strong> {formData.department}
              </p>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4 mt-2">
            <Button
              type="button"
              onClick={onPrev}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl shadow hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
              style={{ fontWeight: 400 }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition font-medium flex items-center justify-center gap-2"
              style={{ fontWeight: 400 }}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </OnboardingLayout>
  );
}