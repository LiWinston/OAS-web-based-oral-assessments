'use client';

import { ArrowRight } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';
import { Button } from '../../ui/button';

export default function OnboardingWelcome({ onNext }) {
  return (
    <OnboardingLayout>
      <div className="flex flex-col items-center text-center">
        {/* Animated Welcome Icon */}
        <div className="mb-6 relative">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-500 hover:scale-110">
            <span className="text-white text-3xl font-bold">OAS</span>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>
        
        <h1 
          className="text-3xl font-semibold text-gray-800 dark:text-white mb-4 animate-fadeIn"
          style={{ fontWeight: 500 }}
        >
          Welcome to OAS
        </h1>
        <p 
          className="text-gray-500 dark:text-gray-300 text-center mb-2 text-lg leading-relaxed"
          style={{ fontWeight: 300 }}
        >
          🎉 Congratulations! You're moments away from accessing the most intuitive oral assessment platform.
        </p>
        <p 
          className="text-gray-400 dark:text-gray-400 text-center mb-8 text-sm"
          style={{ fontWeight: 300 }}
        >
          Let's get your account set up in just a few simple steps. It'll only take 2 minutes!
        </p>
        
        <Button
          onClick={onNext}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg flex items-center justify-center gap-2 transform hover:scale-105"
          style={{ fontWeight: 400 }}
        >
          <span>Start My Journey</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Button>
        
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          ⚡ Quick setup • 🔒 Secure • 🎯 Personalized experience
        </p>
      </div>
    </OnboardingLayout>
  );
}
