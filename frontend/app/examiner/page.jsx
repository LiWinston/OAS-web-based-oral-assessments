"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/button";
import { ExaminerStatsCards } from "../../components/examiner/dashboard/ExaminerStatsCards";
import { TodaysSchedule } from "../../components/examiner/dashboard/TodaysSchedule";
import { PendingFeedback } from "../../components/examiner/dashboard/PendingFeedback";
import { WeeklyCalendar } from "../../components/examiner/dashboard/WeeklyCalendar";

/**
 * ExaminerDashboard Component
 *
 * Main dashboard page for the Examiner interface in the Oral Assessment System.
 * Provides a comprehensive overview of the examiner's assessment activities,
 * including today's schedule, pending feedback, key metrics, and weekly calendar.
 */
export default function ExaminerDashboard() {
  // Access authentication store for user data and role information
  const { user } = useAuthStore();

  // State for controlling welcome animation visibility
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);

  /**
   * Initialize welcome animation with automatic dismissal
   */
  useEffect(() => {
    // Auto-dismiss welcome animation after 3 seconds
    const welcomeTimer = setTimeout(() => {
      setShowWelcomeAnimation(false);
    }, 3000);

    // Cleanup timer on component unmount
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
                <i className="fas fa-clipboard-check text-8xl text-blue-400 animate-bounce-slow"></i>
                <i className="fas fa-sparkles text-2xl text-yellow-300 absolute -top-2 -right-2 animate-pulse"></i>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 animate-slide-up">
              Examiner Dashboard
            </h1>
            <p className="text-xl opacity-90 animate-slide-up animation-delay-200">
              Welcome back! Manage your assessments and provide feedback with
              ease
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
            <i className="fas fa-clipboard-check text-white text-3xl"></i>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2 animate-fade-in">
              Welcome back, {user?.name || "Dr. Thompson"}!
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
                <i className="fas fa-user-check mr-2"></i>
                Examiner Role
              </span>
            </div>
            <p className="text-sm text-blue-100 mt-2">
              You have 3 upcoming assessments today. Here's what's happening
              with your assessments.
            </p>
          </div>
          <div className="flex flex-col space-y-3">
            <Link href="/examiner/schedule">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg transform hover:scale-105 transition-all duration-200 btn-magic">
                <i className="fas fa-calendar-alt"></i>
                <span>View Schedule</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Alert section */}
      <div
        className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start animate-fadeInUp"
        style={{ animationDelay: "500ms" }}
      >
        <div className="text-amber-500 dark:text-amber-400 mr-3 mt-0.5">
          <i className="fas fa-exclamation-circle text-xl"></i>
        </div>
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-300">
            Attention Required
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
            5 assessments from last week need feedback to be submitted by
            tomorrow.
            <Link
              href="/examiner/results"
              className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
            >
              Review now
            </Link>
          </p>
        </div>
      </div>

      {/* Stats section */}
      <div className="animate-fadeInUp" style={{ animationDelay: "600ms" }}>
        <ExaminerStatsCards />
      </div>

      {/* Enhanced Two column layout for main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Enhanced with animations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule */}
          <div className="animate-fadeInUp" style={{ animationDelay: "700ms" }}>
            <TodaysSchedule />
          </div>

          {/* Pending Feedback */}
          <div className="animate-fadeInUp" style={{ animationDelay: "800ms" }}>
            <PendingFeedback />
          </div>
        </div>

        {/* Right column - Enhanced sidebar */}
        <div className="space-y-6">
          {/* Weekly Calendar */}
          <div className="animate-fadeInUp" style={{ animationDelay: "900ms" }}>
            <WeeklyCalendar />
          </div>

          {/* Quick Help Card */}
          <div
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeInUp"
            style={{ animationDelay: "1000ms" }}
          >
            <div className="flex items-start">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center mr-4 flex-shrink-0 transform hover:scale-110 transition-all duration-300">
                <i className="fas fa-question-circle text-purple-600 dark:text-purple-400 text-lg"></i>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 text-lg">
                  📚 Need Help?
                </h4>
                <p className="text-purple-800 dark:text-purple-200 text-sm mb-4 leading-relaxed">
                  Access comprehensive guides, assessment rubrics, and
                  step-by-step tutorials for conducting effective oral
                  assessments.
                </p>
                <div className="flex space-x-2">
                  <Link href="/examiner/documentation" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/20 text-sm"
                    >
                      <i className="fas fa-book-open mr-2"></i>
                      View Guides
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
