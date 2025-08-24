'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeOnboarding } from '../../services/onboardingService';
import { useAuthStore } from '../../store/authStore';
import OnboardingWelcome from './steps/OnboardingWelcome';
import OnboardingBasicInfo from './steps/OnboardingBasicInfo';
import OnboardingDepartment from './steps/OnboardingDepartment';
import OnboardingPassword from './steps/OnboardingPassword';
import OnboardingComplete from './steps/OnboardingComplete';
import { Spinner } from '../ui/spinner';
import { Button } from '../ui/button';

export default function OnboardingWizard({ 
  token, 
  verificationData,
  onError 
}) {
  const router = useRouter();
  const { login } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    token,
    email: verificationData.email || '',
    fullName: verificationData.fullName || '',
    department: verificationData.department || '',
    password: '',
    confirmPassword: ''
  });

  // Determine role and steps configuration
  const role = verificationData.role;
  const isAdmin = role === 'COURSE_ADMIN';
  
  // Configure steps based on role
  const getSteps = () => {
    const steps = ['welcome', 'basicInfo'];
    
    if (isAdmin) {
      steps.push('department');
    }
    
    steps.push('password', 'complete');
    return steps;
  };

  const steps = getSteps();
  const maxSteps = steps.length - 1; // Exclude complete step from progress

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleUpdate = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = async (passwordData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare submission data
      const submissionData = {
        token: formData.token,
        fullName: formData.fullName,
        password: passwordData?.password || formData.password
      };

      // Include department for admins
      if (isAdmin && formData.department) {
        submissionData.department = formData.department;
      }

      // Complete onboarding
      const response = await completeOnboarding(submissionData);

      if (response.success) {
        // Auto-login if tokens are provided
        if (response.data.accessToken) {
          // Use the login response data directly for authentication
          login(response.data);
        }

        // Move to complete step
        handleNext();

        // Redirect after a short delay
        setTimeout(() => {
          const roleRoutes = {
            'ROLE_ADMIN': '/admin',
            'ROLE_STUDENT': '/student',
            'ROLE_EXAMINER': '/examiner',
            'COURSE_ADMIN': '/admin',
            'STUDENT': '/student',
            'EXAMINER': '/examiner'
          };

          // Use the frontend role from the response data or fallback to original role
          const userRole = response.data.frontendRole || response.data.role || role;
          const redirectPath = roleRoutes[userRole] || '/login';
          router.push(redirectPath);
        }, 2000);
      } else {
        throw new Error('Registration failed');
      }
    } catch (err) {
      console.error('Onboarding submission error:', err);
      setError(err.message || 'Failed to complete registration. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getStepLabel = () => {
    const labels = {
      welcome: 'Welcome',
      basicInfo: 'Account Info',
      department: 'Department',
      context: 'Assignment Info',
      password: 'Set Password',
      complete: 'Complete'
    };
    return labels[steps[currentStep]] || '';
  };

  const renderStep = () => {
    const stepName = steps[currentStep];

    switch (stepName) {
      case 'welcome':
        return (
          <OnboardingWelcome
            role={role}
            courseContext={verificationData.courseContext}
            assignmentContext={verificationData.assignmentContext}
            onNext={handleNext}
          />
        );

      case 'basicInfo':
        return (
          <OnboardingBasicInfo
            data={formData}
            role={role}
            onUpdate={handleUpdate}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );

      case 'department':
        return (
          <OnboardingDepartment
            data={formData}
            onUpdate={handleUpdate}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );

      case 'password':
        return (
          <OnboardingPassword
            data={formData}
            role={role}
            onUpdate={handleUpdate}
            onSubmit={handleSubmit}
            onPrev={handlePrev}
            isSubmitting={isSubmitting}
            error={error}
          />
        );

      case 'complete':
        return (
          <OnboardingComplete
            role={role}
            fullName={formData.fullName}
          />
        );

      default:
        return null;
    }
  };

  if (isSubmitting && steps[currentStep] !== 'password') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner className="w-12 h-12 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Setting up your account...</p>
      </div>
    );
  }

  return renderStep();
}