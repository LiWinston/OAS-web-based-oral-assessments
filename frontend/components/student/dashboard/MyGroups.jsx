"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Spinner } from "../../ui/spinner";
import { studentGroupsService } from "../../../services/studentGroupsService";

/**
 * MyGroups Component
 *
 * Displays student's group memberships with member avatars
 * and group information. Integrated with studentGroupsService
 * for real data fetching with mock API support.
 */
export function MyGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memberPreviews, setMemberPreviews] = useState({}); // groupId -> [{studentId,name,avatarUrl}]

  // Align initials color scheme with My Groups page
  const getInitialsColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    return colors[name.length % colors.length];
  };

  const generateMemberInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const groupsData = await studentGroupsService.getCurrentUserGroups();

      // Format groups for UI display, removing duplicates that can appear when backend returns overlapping group contexts
      const formattedGroups = groupsData.map((group) =>
        studentGroupsService.formatGroupForUI(group)
      );
      const uniqueGroups = [];
      const seenGroupIds = new Set();
      formattedGroups.forEach((g) => {
        const key = g.groupId ?? `${g.assignmentId || "na"}-${g.name}`;
        if (seenGroupIds.has(key)) return;
        seenGroupIds.add(key);
        uniqueGroups.push(g);
      });
      setGroups(uniqueGroups);

      // Concurrently fetch small member previews for each group (up to 3 per group)
      try {
        const previews = {};
        const promises = uniqueGroups.map(async (g) => {
          if (memberPreviews[g.groupId]) return;
          const detail = await studentGroupsService.getCurrentUserGroupDetails(g.groupId);
          const members = detail?.members || [];
          previews[g.groupId] = members.slice(0, 3).map(m => ({
            studentId: m.studentId,
            name: m.name,
            avatarUrl: m.avatarUrl || m.photoUrl || m.avatar || undefined,
          }));
        });
        await Promise.allSettled(promises);
        if (Object.keys(previews).length > 0) {
          setMemberPreviews(prev => ({ ...prev, ...previews }));
        }
      } catch (_e) {
        // ignore preview errors
      }
    } catch (err) {
      console.error('Error loading groups for dashboard:', err);
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-5 h-5 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Loading groups...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <i className="fas fa-exclamation-triangle text-2xl text-red-500 mb-2"></i>
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load groups
            </p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-6">
            <i className="fas fa-users text-2xl text-gray-400 mb-2"></i>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No active groups
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Groups will appear here when you're added to them
            </p>
          </div>
        ) : (
          <ul className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {groups.map((group) => (
              <li
                key={group.groupId}
                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {group.name}
                    </h4>
                    <div className="mt-1 space-y-1">
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {group.courseCode}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {group.assignmentName} • {group.semester}
                      </p>
                    </div>

                    {/* Member avatars preview */}
                    <div className="mt-3 flex -space-x-1 overflow-hidden">
                      {(memberPreviews[group.groupId] || []).map((m) => (
                        m.avatarUrl ? (
                          <img
                            key={m.studentId}
                            src={m.avatarUrl}
                            alt={m.name}
                            className="h-6 w-6 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                          />
                        ) : (
                          <div
                            key={m.studentId}
                            className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${getInitialsColor(m.name)} text-white text-xs font-medium ring-2 ring-white dark:ring-gray-800`}
                          >
                            {generateMemberInitials(m.name)}
                          </div>
                        )
                      ))}
                      {(() => {
                        const count = Math.min(group.memberCount, 3) - ((memberPreviews[group.groupId] || []).length);
                        if (count <= 0) return null;
                        return Array.from({ length: count }).map((_, i) => {
                          const placeholderName = `Member ${i + 1}`;
                          return (
                            <div
                              key={`ph-${i}`}
                              className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${getInitialsColor(placeholderName)} text-white text-xs font-medium ring-2 ring-white dark:ring-gray-800`}
                            >
                              {generateMemberInitials(placeholderName)}
                            </div>
                          );
                        });
                      })()}
                      {group.memberCount > 3 && (
                        <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 ring-2 ring-white dark:ring-gray-800">
                          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">
                            +{group.memberCount - 3}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Member count */}
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Active status */}
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
                </div>

                {/* View details link */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <Link 
                    href={`/student/groups/${group.groupId}`}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    View group details →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
