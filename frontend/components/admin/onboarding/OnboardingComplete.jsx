'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle, LogIn } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';
import { Button } from '../../ui/button';

export default function OnboardingComplete({ data }) {
  const router = useRouter();

  const handleGoToLogin = () => {
    // In a real implementation, this would submit the onboarding data to the backend
    // and then redirect to login or dashboard
    console.log('Onboarding data:', data);
    router.push('/admin');
  };

  return (
    <OnboardingLayout step={4} stepLabel="Completed">
      <div className="flex flex-col items-center text-center">
        {/* Animated Success Icon */}
        <div className="mb-6 relative">
          <div className="relative">
            <CheckCircle className="text-green-500 dark:text-green-400 w-24 h-24 mb-4 mx-auto animate-bounce" />
            {/* Celebration particles */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-4xl animate-pulse">🎉</div>
            </div>
          </div>
          {/* Confetti effect (simplified) */}
          <div className="absolute -top-4 -left-4 text-yellow-400 animate-bounce delay-100">✨</div>
          <div className="absolute -top-2 -right-6 text-blue-400 animate-bounce delay-200">🎊</div>
          <div className="absolute top-8 -left-8 text-pink-400 animate-bounce delay-300">🌟</div>
          <div className="absolute top-6 -right-4 text-purple-400 animate-bounce delay-150">🎈</div>
        </div>
        
        <h1 
          className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          style={{ fontWeight: 600 }}
        >
          🎉 Welcome Aboard!
        </h1>
        
        <p 
          className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed"
          style={{ fontWeight: 400 }}
        >
          <strong>Amazing!</strong> Your OAS account is now fully activated and personalized just for you.
        </p>
        
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-6">
          <p className="text-green-800 dark:text-green-300 font-medium text-sm">
            ✅ You're all set! Here's what happens next:
          </p>
          <ul className="text-green-700 dark:text-green-400 text-sm mt-2 space-y-1 text-left">
            <li>• Access your personalized dashboard</li>
            <li>• Start creating oral assessments</li>
            <li>• Invite examiners to your courses</li>
            <li>• Track student progress effortlessly</li>
          </ul>
        </div>
        
        <Button
          onClick={handleGoToLogin}
          className="w-full max-w-xs py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg flex items-center justify-center gap-2 transform hover:scale-105"
          style={{ fontWeight: 500 }}
        >
          <LogIn className="w-5 h-5" />
          <span>Enter My Dashboard</span>
        </Button>
        
        {/* Enhanced Summary */}
        <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-left">
          <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-300 flex items-center">
            👤 Your Profile Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Name:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{data.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Email:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{data.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Department:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">{data.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Courses:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{data.courses?.length || 0} assigned</span>
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
