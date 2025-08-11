"use client";

import Link from "next/link";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/button";
import { StatsCard } from "../../components/admin/dashboard/StatsCard";
import { AssignmentStatusTable } from "../../components/admin/dashboard/AssignmentStatusTable";
import { QuickActions } from "../../components/admin/dashboard/QuickActions";
import { SimpleCalendar } from "../../components/admin/dashboard/SimpleCalendar";

export default function AdminDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Enhanced Header for Admin Dashboard */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-tachometer-alt text-blue-500 text-2xl"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Course Admin Dashboard
            </h1>
            <p className="text-lg text-blue-100 mt-1">
              Welcome back, {user?.name}! Manage your courses and assessments
            </p>
          </div>
        </div>
      </div>

      {/* Stats overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Assignments"
          value="3"
          icon="fas fa-clipboard-check"
          status="normal"
          subtitle="2 in setup, 1 live"
          actionText="Create New"
          actionHref="/admin/assignments/new"
        />

        <StatsCard
          title="Active Courses"
          value="4"
          icon="fas fa-book"
          status="normal"
          subtitle="2 new this semester"
          actionText="Create Course"
          actionHref="/admin/courses"
        />

        <StatsCard
          title="Total Students"
          value="147"
          icon="fas fa-user-graduate"
          status="success"
          subtitle="Across all courses"
          actionText="Import CSV"
          actionHref="/admin/users"
        />

        <StatsCard
          title="Examiners"
          value="8"
          icon="fas fa-users"
          status="normal"
          subtitle="2 pending invites"
          actionText="Invite More"
          actionHref="/admin/users"
        />
      </div>

      {/* Two column layout for main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Status Overview */}
          <AssignmentStatusTable />

          {/* Calendar view */}
          <SimpleCalendar />
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* Onboarding reminder for new users */}
          <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              <i className="fas fa-graduation-cap mr-2"></i>
              Getting Started
            </h4>
            <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
              New to OAS? Complete the onboarding to learn key features and best
              practices.
            </p>
            <Link href="/admin/onboarding">
              <Button size="sm" className="w-full">
                Start Onboarding
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
