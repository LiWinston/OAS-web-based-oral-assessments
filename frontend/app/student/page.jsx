"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/button";
import { WelcomeAnimation } from "../../components/ui/welcome-animation";
import { StudentStatsCards } from "../../components/student/dashboard/StudentStatsCards";
import { UpcomingAssessments } from "../../components/student/dashboard/UpcomingAssessments";
import { RecentResults } from "../../components/student/dashboard/RecentResults";
import { MyGroups } from "../../components/student/dashboard/MyGroups";
import { StudentCalendar } from "../../components/student/dashboard/StudentCalendar";
import { StudentQuickActions } from "../../components/student/dashboard/StudentQuickActions";

/**
 * StudentDashboard Component
 *
 * Main dashboard page for the Student interface in the Oral Assessment System.
 * Provides a comprehensive overview of the student's assessment activities,
 * including upcoming assessments, recent results, group memberships, and quick actions.
 */
export default function StudentDashboard() {
  // Access authentication store for user data and role information
  const { user } = useAuthStore();

  // State for controlling welcome animation visibility
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);

  // Hide welcome animation after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeAnimation(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Enhanced Welcome Animation using shared component */}
      {showWelcomeAnimation && (
        <WelcomeAnimation
          title="Student Dashboard"
          subtitle={`Welcome back! Ready to manage your assessments, ${
            user?.username || user?.email?.split("@")[0] || "Student"
          }?`}
          icon="fa-graduation-cap"
          autoHide={true}
          autoHideDelay={3000}
          onComplete={() => setShowWelcomeAnimation(false)}
        />
      )}

      {/* Enhanced Header with Gradient Background - matching examiner/admin pattern */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl transform transition-all duration-300 hover:shadow-2xl">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300">
            <i className="fas fa-graduation-cap text-white text-3xl"></i>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2 animate-fade-in">
              Welcome back,{" "}
              {user?.username || user?.email?.split("@")[0] || "Student"}!
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
                <i className="fas fa-user-graduate mr-2"></i>
                Student Role
              </span>
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <Link href="/student/assignments">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg transform hover:scale-105 transition-all duration-200 btn-magic">
                <i className="fas fa-tasks"></i>
                <span>View Assignments</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="animate-fadeInUp" style={{ animationDelay: "600ms" }}>
        <StudentStatsCards />
      </div>

      {/* Enhanced Two column layout for main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Enhanced with animations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Assessments */}
          <div className="animate-fadeInUp" style={{ animationDelay: "700ms" }}>
            <UpcomingAssessments />
          </div>

          {/* Recent Results */}
          <div className="animate-fadeInUp" style={{ animationDelay: "800ms" }}>
            <RecentResults />
          </div>
        </div>

        {/* Right column - Enhanced sidebar */}
        <div className="space-y-6">
          {/* My Groups */}
          <div className="animate-fadeInUp" style={{ animationDelay: "900ms" }}>
            <MyGroups />
          </div>

          {/* Calendar */}
          <div
            className="animate-fadeInUp"
            style={{ animationDelay: "1000ms" }}
          >
            <StudentCalendar />
          </div>

          {/* Quick Actions */}
          <div
            className="animate-fadeInUp"
            style={{ animationDelay: "1100ms" }}
          >
            <StudentQuickActions />
          </div>

          {/* Enhanced Help Card - matching examiner/admin pattern */}
          <div
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeInUp"
            style={{ animationDelay: "1200ms" }}
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
                  Access comprehensive guides, assessment tips, and step-by-step
                  tutorials for managing your oral assessments effectively.
                </p>
                <div className="flex space-x-2">
                  <Link href="/student/help" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/20 text-sm"
                    >
                      <i className="fas fa-book-open mr-2"></i>
                      View Help
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
