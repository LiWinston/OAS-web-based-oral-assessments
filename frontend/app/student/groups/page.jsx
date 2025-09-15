'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '../../../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';
import { studentGroupsService } from '../../../services/studentGroupsService';
import Link from 'next/link';

/**
 * Student Groups Page
 * 
 * Displays student's active group memberships following the user flow specification.
 * Shows only active/current groups; past/archived groups are excluded by design.
 * 
 * Features:
 * - Groups Overview: Cards showing group information per assignment
 * - Course/Assignment context display
 * - Member count and avatar initials
 * - View Details navigation
 * - Empty states with helpful messaging
 * - Error handling with user-friendly messages
 * - Loading states
 */
export default function StudentGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("card"); // 'table' or 'card'
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNum, setPageNum] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState('semester_desc');
  const [total, setTotal] = useState(0);
  // Cache of groupId -> preview members [{studentId,name,avatarUrl}]
  const [memberPreviews, setMemberPreviews] = useState({});

  useEffect(() => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated || !user || user.role !== 'STUDENT') {
      setError('You must be signed in as a student to view groups.');
      setLoading(false);
      return;
    }
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, pageSize, sort]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const authState = useAuthStore.getState();
      const studentId = authState?.user?.id ?? 205; // fallback to mock current user id

      const res = await studentGroupsService.getStudentGroups(studentId, {
        status: 'active',
        pageNum,
        pageSize,
        sort,
      });

      const page = res?.data;
      const list = Array.isArray(page?.data) ? page.data : [];

      const formattedGroups = list.map(group => studentGroupsService.formatGroupForUI(group));
      setGroups(formattedGroups);
      setTotal(page?.total || 0);

      // Concurrently fetch small member previews for cards (up to 3 per group)
      try {
        const previews = {};
        const promises = formattedGroups.map(async (g) => {
          // Skip if we already have cached preview
          if (memberPreviews[g.groupId]) return;
          const detail = await studentGroupsService.getGroupDetails(studentId, g.groupId);
          const members = detail?.data?.group?.members || [];
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
        // Swallow preview failures; main list still renders
      }
    } catch (err) {
      console.error('Error loading groups:', err);
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const generateMemberInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getInitialsColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    return colors[name.length % colors.length];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              My Groups
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View your active group memberships
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading your groups...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              My Groups
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View your active group memberships
            </p>
          </div>
        </div>
        
        <Card className="bg-white dark:bg-gray-800 border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="text-center">
              <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Unable to Load Groups
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error}
              </p>
              <Button 
                onClick={loadGroups}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <i className="fas fa-redo mr-2"></i>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <ol className="flex items-center space-x-2">
            <li className="flex items-center">
              <Link
                href="/student"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-1">
                  OAS
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Dashboard
                </span>
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                My Groups
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Enhanced Page Header with Gradient Background */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              <i className="fas fa-users mr-3"></i>
              My Groups
            </h1>
            <p className="text-blue-100">
              View your active group memberships and collaborations
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Tips Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center mr-3 flex-shrink-0">
            <i className="fas fa-lightbulb text-emerald-600 dark:text-emerald-400"></i>
          </div>
          <div>
            <h3 className="font-medium text-emerald-900 dark:text-emerald-100 mb-1">
              Group Collaboration Tips
            </h3>
            <ul className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
              <li className="flex items-start">
                <i className="fas fa-check-circle text-emerald-600 mr-2 mt-0.5"></i>
                Stay connected with your group members through the contact information provided
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-emerald-600 mr-2 mt-0.5"></i>
                Review group details regularly to stay updated on assignments and deadlines
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-emerald-600 mr-2 mt-0.5"></i>
                Coordinate with your team for group assessments and project submissions
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Enhanced Groups List Controls */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
          <div className="flex items-center space-x-2 mb-3 md:mb-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mr-4">
              Active Groups
            </h2>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`
                  px-3 py-1.5 text-sm font-medium transition-all duration-200
                  ${
                    viewMode === "table"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }
                `}
              >
                <i className="fas fa-list mr-1"></i> Table
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`
                  px-3 py-1.5 text-sm font-medium transition-all duration-200
                  ${
                    viewMode === "card"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }
                `}
              >
                <i className="fas fa-th-large mr-1"></i> Cards
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </span>
              <input
                type="text"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64 rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent px-3 py-2 transition-all duration-200"
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => { setPageNum(0); setSort(e.target.value); }}
              className="text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="semester_desc">Newest semester</option>
              <option value="semester_asc">Oldest semester</option>
            </select>

            {/* Page size */}
            <select
              value={pageSize}
              onChange={(e) => { setPageNum(0); setPageSize(parseInt(e.target.value, 10)); }}
              className="text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {/* Groups Display */}
        {groups.length === 0 ? (
          // Empty state - following the user flow specification
          <div className="text-center py-12">
            <i className="fas fa-users text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Active Groups
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              You don't have any active groups yet. When a course coordinator adds you to a group for an assignment, it will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Card View */}
            {viewMode === "card" && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
                {groups
                  .filter(group => 
                    searchTerm === "" || 
                    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    group.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    group.assignmentName.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((group) => (
                  <Card key={group.groupId} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {group.name}
                          </CardTitle>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {group.courseCode}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {group.assignmentName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {group.semester}
                            </p>
                          </div>
                        </div>
                        
                        {/* Status badge */}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Member count and avatars preview */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-2">
                            {/* Show up to first 3 real avatars from details (fallback: initials) */}
                            {(memberPreviews[group.groupId] || []).map((m) => (
                              m.avatarUrl ? (
                                <img
                                  key={m.studentId}
                                  src={m.avatarUrl}
                                  alt={m.name}
                                  className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                                />
                              ) : (
                                <div
                                  key={m.studentId}
                                  className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getInitialsColor(m.name)} text-white text-xs font-medium ring-2 ring-white dark:ring-gray-800`}
                                >
                                  {generateMemberInitials(m.name)}
                                </div>
                              )
                            ))}
                            {/* If fewer than 3 previews, fill with placeholders to keep consistent look */}
                            {(() => {
                              const count = Math.min(group.memberCount, 3) - ((memberPreviews[group.groupId] || []).length);
                              if (count <= 0) return null;
                              return Array.from({ length: count }).map((_, i) => {
                                const placeholderName = `Member ${i + 1}`;
                                return (
                                  <div
                                    key={`ph-${i}`}
                                    className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getInitialsColor(placeholderName)} text-white text-xs font-medium ring-2 ring-white dark:ring-gray-800`}
                                  >
                                    {generateMemberInitials(placeholderName)}
                                  </div>
                                );
                              });
                            })()}
                            {group.memberCount > 3 && (
                              <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 ring-2 ring-white dark:ring-gray-800">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                  +{group.memberCount - 3}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* View Details action */}
                      <Link href={`/student/groups/${group.groupId}`}>
                        <Button 
                          variant="outline" 
                          className="w-full border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
                        >
                          <i className="fas fa-eye mr-2"></i>
                          View Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Table View */}
            {viewMode === "table" && (
              <div className="mt-4 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Group
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Course
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Assignment
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Members
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups
                      .filter(group => 
                        searchTerm === "" || 
                        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        group.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        group.assignmentName.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((group) => (
                      <tr 
                        key={group.groupId} 
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {group.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {group.semester}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {group.courseCode}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {group.assignmentName}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex -space-x-1">
                              {Array.from({length: Math.min(group.memberCount, 3)}).map((_, index) => {
                                const memberName = `Member ${index + 1}`;
                                return (
                                  <div
                                    key={index}
                                    className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${getInitialsColor(memberName)} text-white text-xs font-medium ring-2 ring-white dark:ring-gray-800`}
                                  >
                                    {generateMemberInitials(memberName)}
                                  </div>
                                );
                              })}
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Link href={`/student/groups/${group.groupId}`}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
                            >
                              <i className="fas fa-eye mr-1"></i>
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination & Refresh */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Total: {total} • Page {total === 0 ? 0 : pageNum + 1}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPageNum((p) => Math.max(0, p - 1))}
            disabled={loading || pageNum === 0}
          >
            <i className="fas fa-chevron-left mr-2"></i>
            Prev
          </Button>
          <Button
            variant="outline"
            onClick={() => setPageNum((p) => p + 1)}
            disabled={loading || (pageNum + 1) * pageSize >= total}
          >
            Next
            <i className="fas fa-chevron-right ml-2"></i>
          </Button>
          <Button 
            variant="outline" 
            onClick={loadGroups}
            disabled={loading}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            {loading ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <i className="fas fa-sync-alt mr-2"></i>
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
