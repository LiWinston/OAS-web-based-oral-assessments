'use client';

import { useState, useEffect } from 'react';
import { Moon } from 'lucide-react';

export default function OnboardingLayout({ children, step = 0, maxSteps = 5, stepLabel = '' }) {
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

  const progressPercentage = ((step + 1) / maxSteps) * 100;

  return (
    <div className="min-h-screen flex flex-col justify-between transition-colors duration-300 dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <span 
            className="font-extrabold text-2xl text-blue-700 dark:text-blue-300 tracking-wide font-sans"
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
          className="text-gray-400 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xl focus:outline-none"
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
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                  Step {step + 1} of {maxSteps}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {stepLabel}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-700 ease-out shadow-sm"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="mt-2 text-center">
                <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">
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
