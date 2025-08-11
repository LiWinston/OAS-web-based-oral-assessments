'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

export default function OnboardingPassword({ data, onUpdate, onNext, onPrev }) {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[!@#$%&*]/.test(password);
    
    if (!minLength) {
      return 'Password must be at least 8 characters.';
    }
    if (!hasUpper || !hasLower) {
      return 'Password must contain both uppercase and lowercase letters.';
    }
    if (!hasSpecial) {
      return 'Password must contain at least one special symbol (e.g. !@#$%&*).';
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    onUpdate({ password: formData.password });
    onNext();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  return (
    <OnboardingLayout step={3} stepLabel="Set Password">
      <h1 
        className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center"
        style={{ fontWeight: 400 }}
      >
        Create Your Password
      </h1>
      
      <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
        <div>
          <Label 
            htmlFor="password" 
            className="block text-sm text-gray-500 dark:text-gray-400 mb-1"
          >
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              minLength="8"
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 font-light focus:outline-none focus:ring-2 focus:ring-blue-300 transition pr-12"
              style={{ fontWeight: 300 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <div>
          <Label 
            htmlFor="confirmPassword" 
            className="block text-sm text-gray-500 dark:text-gray-400 mb-1"
          >
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              minLength="8"
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 font-light focus:outline-none focus:ring-2 focus:ring-blue-300 transition pr-12"
              style={{ fontWeight: 300 }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(prev => !prev)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="text-sm text-red-500 dark:text-red-400 text-center">
            {error}
          </div>
        )}
        
        <div className="flex justify-between gap-4 mt-2">
          <Button
            type="button"
            onClick={onPrev}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl shadow hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
            style={{ fontWeight: 400 }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          <Button
            type="submit"
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition font-medium flex items-center justify-center gap-2"
            style={{ fontWeight: 400 }}
          >
            Next<ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
      
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
        Password must be at least 8 characters, contain both uppercase and lowercase letters, and at least one special symbol (e.g. !@#$%&*).<br />
        You can click the <Eye className="inline w-4 h-4" /> icon to show or hide your password.
      </p>
    </OnboardingLayout>
  );
}
