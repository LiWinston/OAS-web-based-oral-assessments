'use client';

import { useState } from 'react';
import OnboardingWelcome from '../../../components/admin/onboarding/OnboardingWelcome';
import OnboardingBasicInfo from '../../../components/admin/onboarding/OnboardingBasicInfo';
import OnboardingDepartment from '../../../components/admin/onboarding/OnboardingDepartment';
import OnboardingCourses from '../../../components/admin/onboarding/OnboardingCourses';
import OnboardingPassword from '../../../components/admin/onboarding/OnboardingPassword';
import OnboardingComplete from '../../../components/admin/onboarding/OnboardingComplete';

export default function AdminOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    email: '',
    fullName: '',
    department: '',
    courses: [],
    password: ''
  });

  const updateOnboardingData = (data) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const steps = [
    {
      component: OnboardingWelcome,
      props: { onNext: nextStep }
    },
    {
      component: OnboardingBasicInfo,
      props: {
        data: onboardingData,
        onUpdate: updateOnboardingData,
        onNext: nextStep,
        onPrev: prevStep
      }
    },
    {
      component: OnboardingDepartment,
      props: {
        data: onboardingData,
        onUpdate: updateOnboardingData,
        onNext: nextStep,
        onPrev: prevStep
      }
    },
    {
      component: OnboardingCourses,
      props: {
        data: onboardingData,
        onUpdate: updateOnboardingData,
        onNext: nextStep,
        onPrev: prevStep
      }
    },
    {
      component: OnboardingPassword,
      props: {
        data: onboardingData,
        onUpdate: updateOnboardingData,
        onNext: nextStep,
        onPrev: prevStep
      }
    },
    {
      component: OnboardingComplete,
      props: { data: onboardingData }
    }
  ];

  const CurrentStepComponent = steps[currentStep].component;
  const currentProps = steps[currentStep].props;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <CurrentStepComponent {...currentProps} />
    </div>
  );
}
