'use client';

import { ArrowRight, UserCheck, Users, GraduationCap } from 'lucide-react';
import OnboardingLayout from '../OnboardingLayout';
import { Button } from '../../ui/button';

export default function OnboardingWelcome({ 
  role, 
  courseContext, 
  assignmentContext, 
  onNext 
}) {
  // Role-specific content
  const getRoleContent = () => {
    switch (role) {
      case 'COURSE_ADMIN':
        return {
          icon: <UserCheck className="w-10 h-10 text-white" />,
          title: 'Welcome Course Administrator',
          subtitle: 'You have been invited to manage courses and assessments',
          description: 'As a Course Admin, you will be able to create and manage oral assessments, configure rubrics, schedule sessions, and oversee the entire assessment process.',
          color: 'from-blue-500 to-blue-600',
          emoji: '🎓'
        };
      
      case 'EXAMINER':
        return {
          icon: <Users className="w-10 h-10 text-white" />,
          title: 'Welcome Examiner',
          subtitle: courseContext ? `You've been assigned to ${courseContext.courseName}` : 'You have been invited as an examiner',
          description: 'As an Examiner, you will be able to self-assign to sessions, conduct oral assessments, and provide marks and feedback to students.',
          color: 'from-purple-500 to-purple-600',
          emoji: '📋'
        };
      
      case 'STUDENT':
        return {
          icon: <GraduationCap className="w-10 h-10 text-white" />,
          title: 'Welcome Student',
          subtitle: courseContext ? `New assessment in ${courseContext.courseName}` : 'You have been invited to an assessment',
          description: 'As a Student, you will be able to book your oral exam slot, view assessment details, and receive your results and feedback.',
          color: 'from-green-500 to-green-600',
          emoji: '📚'
        };
      
      default:
        return {
          icon: <UserCheck className="w-10 h-10 text-white" />,
          title: 'Welcome to OAS',
          subtitle: 'Complete your account setup',
          description: 'Let\'s get your account set up in just a few simple steps.',
          color: 'from-blue-500 to-blue-600',
          emoji: '🎉'
        };
    }
  };

  const content = getRoleContent();

  return (
    <OnboardingLayout role={role}>
      <div className="flex flex-col items-center text-center">
        {/* Animated Icon */}
        <div className="mb-6 relative">
          <div className={`w-20 h-20 bg-gradient-to-br ${content.color} rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-500 hover:scale-110 animate-fadeIn`}>
            {content.icon}
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>
        
        <h1 
          className="text-3xl font-semibold text-gray-800 dark:text-white mb-4 animate-fadeIn"
          style={{ fontWeight: 500 }}
        >
          {content.title}
        </h1>
        
        <p 
          className="text-gray-600 dark:text-gray-300 text-center mb-3 text-lg leading-relaxed"
          style={{ fontWeight: 300 }}
        >
          {content.emoji} {content.subtitle}
        </p>
        
        {/* Show course and assignment context if available */}
        {(courseContext || assignmentContext) && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 w-full max-w-md">
            {courseContext && (
              <>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Course: {courseContext.courseName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Code: {courseContext.courseCode}
                </p>
                {courseContext.coordinatorName && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Coordinator: {courseContext.coordinatorName}
                  </p>
                )}
              </>
            )}
            {assignmentContext && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-2">
                Assessment: {assignmentContext.assignmentName}
              </p>
            )}
          </div>
        )}
        
        <p 
          className="text-gray-400 dark:text-gray-400 text-center mb-8 text-sm max-w-lg"
          style={{ fontWeight: 300 }}
        >
          {content.description}
        </p>
        
        <Button
          onClick={onNext}
          className={`w-full max-w-sm py-4 bg-gradient-to-r ${content.color} hover:opacity-90 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg flex items-center justify-center gap-2 transform hover:scale-105`}
          style={{ fontWeight: 400 }}
        >
          <span>Start Setup</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Button>
        
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          ⚡ Quick setup • 🔒 Secure • 🎯 Role-specific experience
        </p>
      </div>
    </OnboardingLayout>
  );
}
