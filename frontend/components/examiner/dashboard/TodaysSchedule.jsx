"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";

/**
 * Mock data for today's scheduled assessments
 */
const mockTodaysAssessments = [
  {
    id: 1,
    title: "Project Proposal Presentation",
    course: "COMP90082",
    courseTitle: "Software Project Management",
    time: "10:30 AM - 11:00 AM",
    location: "Room 405, Engineering Building",
    type: "group",
    participants: "Group #12",
    status: "upcoming",
  },
  {
    id: 2,
    title: "Mid-Semester Project Update",
    course: "INFO30005",
    courseTitle: "Web Information Technologies",
    time: "2:00 PM - 2:30 PM",
    location: "Room 203, ICT Building",
    type: "group",
    participants: "Group #5",
    status: "upcoming",
  },
  {
    id: 3,
    title: "Individual Reflection",
    course: "INFO20003",
    courseTitle: "Database Systems",
    time: "4:15 PM - 4:30 PM",
    location: "Online (Zoom)",
    type: "individual",
    participants: "Michelle Zhang",
    status: "upcoming",
  },
];

/**
 * Status styling configuration for assessment status badges
 */
const statusStyles = {
  upcoming: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  active: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  completed: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
};

/**
 * TodaysSchedule Component
 * 
 * Displays the examiner's assessment schedule for the current day in a structured card format.
 * Shows detailed information for each assessment including time, location, participants,
 * and provides action buttons for starting assessments or joining online sessions.
 */
export function TodaysSchedule() {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-day text-blue-600 dark:text-blue-400 mr-2"></i>{" "}
            Today's Schedule
          </CardTitle>
          <Link
            href="/examiner/schedule"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Full Schedule
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {mockTodaysAssessments.map((assessment) => (
            <div
              key={assessment.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="md:flex md:justify-between md:items-center">
                <div className="mb-3 md:mb-0">
                  <div className="flex items-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mr-2 ${
                        statusStyles[assessment.status]
                      }`}
                    >
                      {assessment.status.charAt(0).toUpperCase() +
                        assessment.status.slice(1)}
                    </span>
                    <span className="font-medium">{assessment.title}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {assessment.course} - {assessment.courseTitle}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                  <div className="flex items-center text-sm">
                    <i className="fas fa-clock text-gray-400 mr-2"></i>
                    <span>{assessment.time}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <i className="fas fa-map-marker-alt text-gray-400 mr-2"></i>
                    <span>{assessment.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <i
                      className={`fas ${
                        assessment.type === "group"
                          ? "fa-user-friends"
                          : "fa-user"
                      } text-gray-400 mr-2`}
                    ></i>
                    <span>{assessment.participants}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                {assessment.location.includes("Online") ? (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <i className="fas fa-video mr-2"></i>
                    Join Online
                  </Button>
                ) : (
                  <Link href="/examiner/assessment">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <i className="fas fa-play mr-2"></i>
                      Start Assessment
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {mockTodaysAssessments.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <i className="fas fa-calendar-check text-4xl mb-2"></i>
              <p>No assessments scheduled for today</p>
            </div>
            <Link href="/examiner/schedule">
              <Button variant="outline">View Full Schedule</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
