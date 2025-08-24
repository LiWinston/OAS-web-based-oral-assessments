'use client';

import { useState } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import OnboardingLayout from '../OnboardingLayout';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Spinner } from '../../ui/spinner';

export default function OnboardingPassword({ 
  data, 
  role,
  onUpdate, 
  onSubmit, 
  onPrev,
  isSubmitting,
  error 
}) {
  const [formData, setFormData] = useState({
    password: data.password || '',
    confirmPassword: data.confirmPassword || ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Password validation rules
  const passwordRules = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  };

  const isPasswordValid = Object.values(passwordRules).filter(Boolean).length >= 4;

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordValid) {
      newErrors.password = 'Password does not meet requirements';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Pass the password data directly to onSubmit
      await onSubmit({
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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
  const maxSteps = role === 'COURSE_ADMIN' ? 4 : 3;
  const currentStep = role === 'COURSE_ADMIN' ? 2 : 2;

  return (
    <OnboardingLayout step={currentStep} stepLabel="Set Password" role={role} maxSteps={maxSteps}>
      <div className="w-full">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-${color}-100 dark:bg-${color}-900/30 rounded-full mb-4`}>
            <Lock className={`w-8 h-8 text-${color}-600 dark:text-${color}-400`} />
          </div>
          <h1 
            className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white mb-2"
            style={{ fontWeight: 400 }}
          >
            Create Your Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a strong password to secure your account
          </p>
        </div>
        
        <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Password Field */}
          <div>
            <Label 
              htmlFor="password" 
              className="block text-sm text-gray-600 dark:text-gray-400 mb-2"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                  errors.password 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-200 dark:border-gray-700'
                } bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 font-light focus:outline-none focus:ring-2 focus:ring-${color}-300 transition`}
                style={{ fontWeight: 300 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                {errors.password}
              </p>
            )}
          </div>
          
          {/* Password Requirements */}
          {formData.password && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Password Requirements (meet at least 4):
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {passwordRules.minLength ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <X className="w-3 h-3 text-gray-300" />
                  )}
                  <span className={`text-xs ${passwordRules.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordRules.hasUpperCase ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <X className="w-3 h-3 text-gray-300" />
                  )}
                  <span className={`text-xs ${passwordRules.hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                    One uppercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordRules.hasLowerCase ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <X className="w-3 h-3 text-gray-300" />
                  )}
                  <span className={`text-xs ${passwordRules.hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                    One lowercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordRules.hasNumber ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <X className="w-3 h-3 text-gray-300" />
                  )}
                  <span className={`text-xs ${passwordRules.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                    One number
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordRules.hasSpecial ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <X className="w-3 h-3 text-gray-300" />
                  )}
                  <span className={`text-xs ${passwordRules.hasSpecial ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                    One special character
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Confirm Password Field */}
          <div>
            <Label 
              htmlFor="confirmPassword" 
              className="block text-sm text-gray-600 dark:text-gray-400 mb-2"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                  errors.confirmPassword 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-200 dark:border-gray-700'
                } bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 font-light focus:outline-none focus:ring-2 focus:ring-${color}-300 transition`}
                style={{ fontWeight: 300 }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                {errors.confirmPassword}
              </p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="text-xs text-green-500 dark:text-green-400 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Passwords match
              </p>
            )}
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4 mt-2">
            <Button
              type="button"
              onClick={onPrev}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl shadow hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium disabled:opacity-50"
              style={{ fontWeight: 400 }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isPasswordValid}
              className={`flex-1 py-3 bg-${color}-600 hover:bg-${color}-700 text-white rounded-xl shadow transition font-medium flex items-center justify-center gap-2 disabled:opacity-50`}
              style={{ fontWeight: 400 }}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Creating Account...
                </>
              ) : (
                <>
                  Complete Setup
                  <Check className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </OnboardingLayout>
  );
}