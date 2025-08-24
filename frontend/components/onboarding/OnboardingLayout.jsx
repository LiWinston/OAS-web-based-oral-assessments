'use client';

import { useState, useEffect } from 'react';
import { Moon } from 'lucide-react';

export default function OnboardingLayout({ 
  children, 
  step = -1, 
  maxSteps = 5, 
  stepLabel = '',
  role = null 
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  };

  const progressPercentage = step >= 0 && step < maxSteps 
    ? ((step + 1) / maxSteps) * 100 
    : 0;

  // Role-based color theming
  const getRoleColors = () => {
    switch(role) {
      case 'COURSE_ADMIN':
        return {
          primary: 'from-blue-500 to-blue-600',
          accent: 'text-blue-600 dark:text-blue-300',
          hover: 'hover:text-blue-600 dark:hover:text-blue-400'
        };
      case 'EXAMINER':
        return {
          primary: 'from-purple-500 to-purple-600',
          accent: 'text-purple-600 dark:text-purple-300',
          hover: 'hover:text-purple-600 dark:hover:text-purple-400'
        };
      case 'STUDENT':
        return {
          primary: 'from-green-500 to-green-600',
          accent: 'text-green-600 dark:text-green-300',
          hover: 'hover:text-green-600 dark:hover:text-green-400'
        };
      default:
        return {
          primary: 'from-blue-500 to-blue-600',
          accent: 'text-blue-600 dark:text-blue-300',
          hover: 'hover:text-blue-600 dark:hover:text-blue-400'
        };
    }
  };

  const colors = getRoleColors();

  return (
    <div className="min-h-screen flex flex-col justify-between transition-colors duration-300 dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <span 
            className={`font-extrabold text-2xl ${colors.accent} tracking-wide font-sans`}
            style={{
              letterSpacing: '0.1em',
              fontFamily: "'Inter', 'Helvetica Neue', Arial, 'sans-serif'",
              fontWeight: 600
            }}
          >
            OAS
          </span>
        </div>
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          className={`text-gray-400 dark:text-gray-300 ${colors.hover} text-xl focus:outline-none`}
        >
          <Moon className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div 
          className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-10 md:p-14 flex flex-col items-center"
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, 'sans-serif'",
            fontWeight: 300
          }}
        >
          {/* Progress Bar */}
          {step >= 0 && step < maxSteps && (
            <div className="w-full mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${colors.accent}`}>
                  Step {step + 1} of {maxSteps}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {stepLabel}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`bg-gradient-to-r ${colors.primary} h-2 rounded-full transition-all duration-700 ease-out shadow-sm`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="mt-2 text-center">
                <span className={`text-xs ${colors.accent} font-medium`}>
                  {Math.round(progressPercentage)}% Complete
                </span>
              </div>
            </div>
          )}
          
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">
        &copy; 2025 Oral Assessment System. All rights reserved.
      </footer>
    </div>
  );
}