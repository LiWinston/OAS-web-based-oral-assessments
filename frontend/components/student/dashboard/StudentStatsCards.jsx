"use client";

import { useEffect, useState } from "react";
import { StatsCard, StatsCardSkeleton } from "../../ui/stats-card";
import useAuthStore from "../../../store/authStore";
import studentBookingServiceReal from "../../../services/studentBookingReal";
import { studentResultsService } from "../../../services/studentResultsService";
import { studentGroupsService } from "../../../services/studentGroupsService";

/**
 * StudentStatsCards Component (Live)
 *
 * Connects stats to backend:
 * - Total Assessments: /api/students/{id}/assignments (status=all)
 * - Upcoming: /api/students/{id}/assignments (status=bookable)
 * - Completed: /api/students/{id}/results (status=released)
 * - Groups: /api/students/{id}/groups (status=active)
 */
export function StudentStatsCards() {
  const { user } = useAuthStore();
  const studentId = user?.id;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, groups: 0 });

  useEffect(() => {
    let mounted = true;
    const getTotalFromWrapped = (wrapped) => {
      const d = wrapped?.data;
      if (typeof d?.total === "number") return d.total;
      if (Array.isArray(d?.data)) return d.data.length;
      return 0;
    };

    const load = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [allRes, bookableRes, resultsRes, groupsRes] = await Promise.all([
          studentBookingServiceReal.getStudentAssignments(studentId, { status: "all", pageNum: 0, pageSize: 1, sort: "date_asc" }),
          studentBookingServiceReal.getStudentAssignments(studentId, { status: "bookable", pageNum: 0, pageSize: 1, sort: "date_asc" }),
          studentResultsService.getStudentResults(studentId, { status: "released", semester: "current", pageNum: 0, pageSize: 1, sort: "date_desc" }),
          studentGroupsService.getStudentGroups(studentId, { status: "active", pageNum: 0, pageSize: 1, sort: "semester_desc" }),
        ]);

        const total = getTotalFromWrapped(allRes);
        const upcoming = getTotalFromWrapped(bookableRes);
        const completed = resultsRes?.data?.total ?? (Array.isArray(resultsRes?.data?.data) ? resultsRes.data.data.length : 0);
        const groups = groupsRes?.data?.total ?? 0;

        if (mounted) setStats({ total, upcoming, completed, groups });
      } catch (e) {
        // Fallback to zeros on error; console already logs via apiClient
        if (mounted) setStats({ total: 0, upcoming: 0, completed: 0, groups: 0 });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [studentId]);

  if (loading) {
    return <StatsCardSkeleton count={4} />;
  }

  const cards = [
    {
      title: "Total Assessments",
      value: String(stats.total),
      icon: "fa-tasks",
      bgColor: "from-blue-500 to-blue-600",
      shadowColor: "hover:shadow-blue-200 dark:hover:shadow-blue-900/50",
      iconBg: "bg-blue-100 dark:bg-blue-800",
      hoverEffect: "hover:-translate-y-1 hover:shadow-xl",
      actionText: "View Bookings",
      actionHref: "/student/booking",
      index: 0,
    },
    {
      title: "Upcoming",
      value: String(stats.upcoming),
      icon: "fa-calendar-plus",
      bgColor: "from-orange-500 to-orange-600",
      shadowColor: "hover:shadow-orange-200 dark:hover:shadow-orange-900/50",
      iconBg: "bg-orange-100 dark:bg-orange-800",
      hoverEffect: "hover:-translate-y-1 hover:shadow-xl",
      actionText: "Book Now",
      actionHref: "/student/booking",
      index: 1,
    },
    {
      title: "Completed",
      value: String(stats.completed),
      icon: "fa-check-circle",
      bgColor: "from-green-500 to-green-600",
      shadowColor: "hover:shadow-green-200 dark:hover:shadow-green-900/50",
      iconBg: "bg-green-100 dark:bg-green-800",
      hoverEffect: "hover:-translate-y-1 hover:shadow-xl",
      actionText: "View Results",
      actionHref: "/student/results",
      index: 2,
    },
    {
      title: "Groups",
      value: String(stats.groups),
      icon: "fa-users",
      bgColor: "from-purple-500 to-purple-600",
      shadowColor: "hover:shadow-purple-200 dark:hover:shadow-purple-900/50",
      iconBg: "bg-purple-100 dark:bg-purple-800",
      hoverEffect: "hover:-translate-y-1 hover:shadow-xl",
      actionText: "View Groups",
      actionHref: "/student/groups",
      index: 3,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          bgColor={stat.bgColor}
          shadowColor={stat.shadowColor}
          iconBg={stat.iconBg}
          hoverEffect={stat.hoverEffect}
          warning={stat.warning}
          actionText={stat.actionText}
          actionHref={stat.actionHref}
          index={stat.index}
        />
      ))}
    </div>
  );
}
