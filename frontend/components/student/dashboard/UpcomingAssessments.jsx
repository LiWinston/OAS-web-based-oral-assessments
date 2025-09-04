"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";

/**
 * UpcomingAssessments Component
 *
 * Displays a list of upcoming assessments with their booking status,
 * dates, times, venues, and action buttons.
 */
export function UpcomingAssessments() {
  // Mock data - will be replaced with real data from API
  const assessments = [
    {
      id: 1,
      title: "Software Project Management - Final Presentation",
      course: "COMP90082",
      date: "April 15, 2025",
      time: "10:30 AM - 11:00 AM",
      venue: "Room 202, Doug McDonell Building",
      type: "Group Assessment",
      status: "booked",
      groupMembers: [
        "Alice Johnson",
        "Bob Smith",
        "Carol Davis",
        "David Wilson",
      ],
    },
    {
      id: 2,
      title: "Web Information Technology - Progress Evaluation",
      course: "INFO30005",
      date: "April 18, 2025",
      time: "2:00 PM - 2:30 PM",
      venue: "Room 105, ICT Building",
      type: "Individual Assessment",
      status: "booking_required",
      deadline: "April 15, 2025",
    },
    {
      id: 3,
      title: "IT Project - Project Defense",
      course: "COMP30022",
      date: "April 25, 2025",
      time: "Time TBD",
      venue: "Venue TBD",
      type: "Group Assessment",
      status: "booking_required",
      deadline: "April 20, 2025",
      groupMembers: ["Emma Brown", "Frank Miller", "Grace Lee"],
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "booked":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <i className="fas fa-check-circle mr-1"></i>
            Booked
          </span>
        );
      case "booking_required":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <i className="fas fa-exclamation-circle mr-1"></i>
            Booking Required
          </span>
        );
      default:
        return null;
    }
  };

  const getActionButton = (assessment) => {
    if (assessment.status === "booked") {
      return (
        <Link href={`/student/booking`}>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      );
    } else {
      return (
        <Link href={`/student/booking/${assessment.id}`}>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Book Now
          </Button>
        </Link>
      );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date
      .toLocaleDateString("en-US", { month: "short" })
      .toUpperCase();
    const day = date.getDate();
    return { month, day };
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-day text-blue-600 dark:text-blue-400 mr-2"></i>
            Your Upcoming Assessments
          </CardTitle>
          <Link
            href="/student/booking"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {assessments.map((assessment) => {
            const { month, day } = formatDate(assessment.date);
            return (
              <li key={assessment.id} className="py-4">
                <div className="flex items-start space-x-4">
                  {/* Date display */}
                  <div className="flex-shrink-0">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {month}
                      </span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {day}
                      </span>
                    </div>
                  </div>

                  {/* Assessment details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {assessment.title}
                    </p>
                    <div className="mt-1 flex items-center flex-wrap gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        <i className="fas fa-clock mr-1"></i>
                        {assessment.time}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        <i className="fas fa-map-marker-alt mr-1"></i>
                        {assessment.venue}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        <i
                          className={`fas ${
                            assessment.type === "Group Assessment"
                              ? "fa-users"
                              : "fa-user"
                          } mr-1`}
                        ></i>
                        {assessment.type}
                      </span>
                    </div>

                    {/* Group members for group assessments */}
                    {assessment.groupMembers && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                          Group:
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {assessment.groupMembers.join(", ")}
                        </span>
                      </div>
                    )}

                    {/* Booking deadline for unbooked assessments */}
                    {assessment.status === "booking_required" &&
                      assessment.deadline && (
                        <div className="mt-2">
                          <span className="text-xs text-orange-600 dark:text-orange-400">
                            <i className="fas fa-exclamation-triangle mr-1"></i>
                            Booking deadline: {assessment.deadline}
                          </span>
                        </div>
                      )}

                    {/* Status badge */}
                    <div className="mt-2 flex">
                      {getStatusBadge(assessment.status)}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="flex-shrink-0">
                    {getActionButton(assessment)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* More button - matching examiner/admin pattern */}
        <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/student/booking"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            View all {assessments.length} upcoming assessments
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
