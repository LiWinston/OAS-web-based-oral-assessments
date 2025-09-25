"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ScheduleFilters from "@/components/examiner/schedule/ScheduleFilters";
import AssignmentsAvailable from "@/components/student/booking/AssignmentsAvailable";
import MyBookings from "@/components/student/booking/MyBookings";
import StudentCalendar from "@/components/student/booking/StudentCalendar";
import useAuth from "@/hooks/useAuth";
import { studentBookingServiceReal as studentBookingService } from "@/services/studentBookingReal";

/**
 * Student Booking Page
 *
 * Main entry for student booking management, following the examiner schedule page layout:
 * - Assignments Available to Book
 * - My Bookings (upcoming)
 * - Calendar view of booked timeslots
 */
export default function StudentBooking() {
  const { user, isAuthenticated } = useAuth();
  const studentId = user?.id || user?.userId || user?.studentId;
  const [availableCourses, setAvailableCourses] = useState([]);

  // Fetch assignments to derive course filter options
  const { data: assignmentsData } = useQuery({
    queryKey: ["studentAssignmentsInit", studentId],
    queryFn: () =>
      studentBookingService.getStudentAssignments(studentId, {
        status: "all",
        pageSize: 100,
      }),
    enabled: isAuthenticated && Boolean(studentId),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (assignmentsData?.data?.data) {
      const courses = [
        ...new Set(assignmentsData.data.data.map((a) => a.courseCode)),
      ]
        .sort()
        .map((code) => {
          const a = assignmentsData.data.data.find(
            (x) => x.courseCode === code
          );
          return { code, name: a?.courseName || code };
        });
      setAvailableCourses(courses);
    }
  }, [assignmentsData]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <ol className="flex items-center space-x-2">
            <li className="flex items-center">
              <span className="font-bold text-blue-600 dark:text-blue-400 mr-1">
                OAS
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Student
              </span>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                My Bookings
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Header & Filters */}
      <div className="dashboard-card">
        <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              My Booking Board
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Book and manage your assessment timeslots
            </p>
          </div>

          <ScheduleFilters courseOptions={availableCourses} />
        </div>
      </div>

      {/* Content */}
      <AssignmentsAvailable />
      <MyBookings />
      <StudentCalendar />

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center">
            <i className="fas fa-info-circle mr-2"></i>
            Availability updates every few minutes
          </div>
          <div className="flex items-center">
            <i className="fas fa-mouse-pointer mr-2"></i>
            Click Book Now to select a time
          </div>
          <div className="flex items-center">
            <i className="fas fa-times-circle mr-2"></i>
            You can cancel bookings before the deadline
          </div>
        </div>
      </div>
    </div>
  );
}
