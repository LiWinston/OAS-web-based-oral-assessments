'use client'

import { CourseOverviewTable } from '@/components/superadmin/dashboard/CourseOverviewTable'

export default function CoursesOverview() {
  return (
    <div className="space-y-8">
      {/* Enhanced Header with Orange Theme */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-university text-orange-500 text-2xl"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Courses Overview
            </h1>
            <p className="text-lg text-orange-100 mt-1">
              System-wide oversight of all courses and their administration
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Course Overview Table */}
      <CourseOverviewTable />
    </div>
  )
}