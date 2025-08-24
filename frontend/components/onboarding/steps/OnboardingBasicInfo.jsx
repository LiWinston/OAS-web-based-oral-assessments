'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Mail } from 'lucide-react';
import OnboardingLayout from '../OnboardingLayout';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

export default function OnboardingBasicInfo({ 
  data, 
  role,
  onUpdate, 
  onNext, 
  onPrev 
}) {
  const [formData, setFormData] = useState({
    email: data.email || '',
    fullName: data.fullName || ''
  });
  
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Get role-specific content
  const getRoleColor = () => {
    switch (role) {
      case 'COURSE_ADMIN':
        return 'blue';
      case 'EXAMINER':
        return 'purple';
      case 'STUDENT':
        return 'green';
      default:
        return 'blue';
    }
  };

  const color = getRoleColor();

  return (
    <OnboardingLayout step={0} stepLabel="Account Info" role={role} maxSteps={role === 'COURSE_ADMIN' ? 4 : 3}>
      <div className="w-full">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-${color}-100 dark:bg-${color}-900/30 rounded-full mb-4`}>
            <User className={`w-8 h-8 text-${color}-600 dark:text-${color}-400`} />
          </div>
          <h1 
            className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white mb-2"
            style={{ fontWeight: 400 }}
          >
            Confirm Your Details
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please verify your email and provide your full name
          </p>
        </div>
        
        <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Email Field - Read Only */}
          <div>
            <Label 
              htmlFor="email" 
              className="block text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              readOnly
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-light focus:outline-none cursor-not-allowed"
              style={{ fontWeight: 300 }}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              This email cannot be changed as it's linked to your invitation
            </p>
          </div>
          
          {/* Full Name Field */}
          <div>
            <Label 
              htmlFor="fullname" 
              className="block text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Full Name
            </Label>
            <Input
              id="fullname"
              name="fullname"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              required
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.fullName 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-200 dark:border-gray-700'
              } bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 font-light focus:outline-none focus:ring-2 focus:ring-${color}-300 transition`}
              style={{ fontWeight: 300 }}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                {errors.fullName}
              </p>
            )}
          </div>
          
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
              className={`flex-1 py-3 bg-${color}-600 hover:bg-${color}-700 text-white rounded-xl shadow transition font-medium flex items-center justify-center gap-2`}
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