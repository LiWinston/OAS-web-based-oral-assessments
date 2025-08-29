"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

/**
 * MyGroups Component
 *
 * Displays student's group memberships with member avatars
 * and group information.
 */
export function MyGroups() {
  // Mock data - will be replaced with real data from API
  const groups = [
    {
      id: 1,
      name: "SPM - Group 5",
      course: "Software Project Management",
      courseCode: "COMP90082",
      members: [
        {
          id: 1,
          name: "Alice Johnson",
          avatar: "/api/placeholder/24/24",
          role: "Leader",
        },
        {
          id: 2,
          name: "Bob Smith",
          avatar: "/api/placeholder/24/24",
          role: "Developer",
        },
        {
          id: 3,
          name: "Carol Davis",
          avatar: "/api/placeholder/24/24",
          role: "Designer",
        },
        {
          id: 4,
          name: "David Wilson",
          avatar: "/api/placeholder/24/24",
          role: "Tester",
        },
        {
          id: 5,
          name: "You",
          avatar: "/api/placeholder/24/24",
          role: "Developer",
          isCurrentUser: true,
        },
      ],
      upcomingAssessment: {
        title: "Final Presentation",
        date: "April 15, 2025",
        status: "booked",
      },
    },
    {
      id: 2,
      name: "IT Project - Group 7",
      course: "IT Project",
      courseCode: "COMP30022",
      members: [
        {
          id: 1,
          name: "Emma Brown",
          avatar: "/api/placeholder/24/24",
          role: "Leader",
        },
        {
          id: 2,
          name: "Frank Miller",
          avatar: "/api/placeholder/24/24",
          role: "Backend",
        },
        {
          id: 3,
          name: "Grace Lee",
          avatar: "/api/placeholder/24/24",
          role: "Frontend",
        },
        {
          id: 4,
          name: "You",
          avatar: "/api/placeholder/24/24",
          role: "Full Stack",
          isCurrentUser: true,
        },
      ],
      upcomingAssessment: {
        title: "Project Defense",
        date: "April 25, 2025",
        status: "booking_required",
      },
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "booked":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <i className="fas fa-check-circle mr-1"></i>
            Booked
          </span>
        );
      case "booking_required":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            <i className="fas fa-clock mr-1"></i>
            Needs Booking
          </span>
        );
      default:
        return null;
    }
  };

  const generateAvatar = (name) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    const colorIndex = name.length % colors.length;

    return (
      <div
        className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${colors[colorIndex]} text-white text-xs font-medium ring-2 ring-white dark:ring-gray-800`}
      >
        {initials}
      </div>
    );
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-users text-purple-600 dark:text-purple-400 mr-2"></i>
            My Groups
          </CardTitle>
          <Link
            href="/student/groups"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <ul className="space-y-4">
          {groups.map((group) => (
            <li
              key={group.id}
              className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {group.name}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {group.course} ({group.courseCode})
                  </p>

                  {/* Member avatars */}
                  <div className="mt-3 flex -space-x-1 overflow-hidden">
                    {group.members.slice(0, 4).map((member) => (
                      <div key={member.id} className="relative group">
                        {generateAvatar(member.name)}
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          {member.name} ({member.role})
                        </div>
                      </div>
                    ))}
                    {group.members.length > 4 && (
                      <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 ring-2 ring-white dark:ring-gray-800">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          +{group.members.length - 4}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Member count */}
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {group.members.length} members
                  </p>
                </div>
              </div>

              {/* Upcoming assessment */}
              {group.upcomingAssessment && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Next: {group.upcomingAssessment.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {group.upcomingAssessment.date}
                      </p>
                    </div>
                    {getStatusBadge(group.upcomingAssessment.status)}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
