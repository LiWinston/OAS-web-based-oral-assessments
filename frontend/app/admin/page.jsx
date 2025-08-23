"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/button";
import { AssignmentStatusTable } from "../../components/admin/dashboard/AssignmentStatusTable";
import { QuickActions } from "../../components/admin/dashboard/QuickActions";
import { SimpleCalendar } from "../../components/admin/dashboard/SimpleCalendar";

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);

  // Initialize welcome animation
  useEffect(() => {
    // Ensure welcome animation doesn't get stuck
    const welcomeTimer = setTimeout(() => {
      setShowWelcomeAnimation(false);
    }, 3000);

    return () => clearTimeout(welcomeTimer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Enhanced Welcome Animation Overlay */}
      {showWelcomeAnimation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900/90 via-indigo-900/90 to-purple-900/90 backdrop-blur-sm animate-fade-in cursor-pointer"
          onClick={() => setShowWelcomeAnimation(false)}
        >
          <div className="text-center text-white animate-scale-in">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <i className="fas fa-tachometer-alt text-8xl text-blue-400 animate-bounce-slow"></i>
                <i className="fas fa-sparkles text-2xl text-yellow-300 absolute -top-2 -right-2 animate-pulse"></i>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 animate-slide-up">
              Administrator Dashboard
            </h1>
            <p className="text-xl opacity-90 animate-slide-up animation-delay-200">
              Welcome back! Manage your courses and assessments with ease
            </p>
            <p className="text-sm opacity-70 mt-6 animate-fade-in">
              Click anywhere to continue
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Header with Gradient Background */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl transform transition-all duration-300 hover:shadow-2xl">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300">
            <i className="fas fa-tachometer-alt text-white text-3xl"></i>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2 animate-fade-in">
              Course Admin Dashboard
            </h1>
            <div className="flex items-center space-x-4 text-blue-100 text-sm">
              <span className="flex items-center animate-slide-up animation-delay-300">
                <i className="fas fa-clock mr-2"></i>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center animate-slide-up animation-delay-400">
                <i className="fas fa-user-shield mr-2"></i>
                Administrator Role
              </span>
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <Link href="/admin/courses">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg transform hover:scale-105 transition-all duration-200 btn-magic">
                <i className="fas fa-plus"></i>
                <span>New Course</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Enhanced Two column layout for main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Enhanced with animations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enhanced Assignment Status Overview */}
          <div className="animate-fadeInUp" style={{ animationDelay: "600ms" }}>
            <AssignmentStatusTable />
          </div>

          {/* Enhanced Calendar view */}
          <div className="animate-fadeInUp" style={{ animationDelay: "700ms" }}>
            <SimpleCalendar />
          </div>
        </div>

        {/* Right column - Enhanced sidebar */}
        <div className="space-y-6">
          {/* Enhanced Quick Actions */}
          <div className="animate-fadeInUp" style={{ animationDelay: "800ms" }}>
            <QuickActions />
          </div>

          {/* Enhanced Onboarding reminder with new styling */}
          <div
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeInUp"
            style={{ animationDelay: "1000ms" }}
          >
            <div className="flex items-start">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mr-4 flex-shrink-0 transform hover:scale-110 transition-all duration-300">
                <i className="fas fa-graduation-cap text-blue-600 dark:text-blue-400 text-lg"></i>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 text-lg">
                  🚀 Getting Started Guide
                </h4>
                <p className="text-blue-800 dark:text-blue-200 text-sm mb-4 leading-relaxed">
                  New to OAS? Our interactive onboarding will guide you through
                  key features, best practices, and help you set up your first
                  assessment in minutes.
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-xs text-blue-700 dark:text-blue-300">
                    <i className="fas fa-check-circle text-blue-600 mr-2"></i>
                    <span>Learn essential features and workflows</span>
                  </div>
                  <div className="flex items-center text-xs text-blue-700 dark:text-blue-300">
                    <i className="fas fa-check-circle text-blue-600 mr-2"></i>
                    <span>Discover time-saving tips and shortcuts</span>
                  </div>
                  <div className="flex items-center text-xs text-blue-700 dark:text-blue-300">
                    <i className="fas fa-check-circle text-blue-600 mr-2"></i>
                    <span>Set up your first course and assignment</span>
                  </div>
                </div>
                <Link href="/admin/onboarding">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transform hover:scale-105 transition-all duration-200 btn-magic">
                    <i className="fas fa-rocket mr-2"></i>
                    Start Onboarding Journey
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Enhanced Documentation Quick Access */}
          <div
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeInUp"
            style={{ animationDelay: "1100ms" }}
          >
            <div className="flex items-start">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center mr-4 flex-shrink-0 transform hover:scale-110 transition-all duration-300">
                <i className="fas fa-book-open text-purple-600 dark:text-purple-400 text-lg"></i>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 text-lg">
                  📚 Help & Documentation
                </h4>
                <p className="text-purple-800 dark:text-purple-200 text-sm mb-4 leading-relaxed">
                  Access comprehensive guides, FAQs, and step-by-step tutorials
                  to maximize your efficiency with the Oral Assessment System.
                </p>
                <div className="flex space-x-2">
                  <Link href="/admin/documentation" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/20 text-sm"
                    >
                      <i className="fas fa-question-circle mr-2"></i>
                      View Docs
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
