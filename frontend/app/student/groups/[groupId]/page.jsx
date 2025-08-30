'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Removed Card imports as we're using admin-style layout
import { Button } from '../../../../components/ui/button';
import { Spinner } from '../../../../components/ui/spinner';
import { studentGroupsService } from '../../../../services/studentGroupsService';
import Link from 'next/link';

/**
 * Student Group Details Page
 * 
 * Displays detailed information about a specific group including all members.
 * Follows the user flow specification for Group Details view.
 * 
 * Features:
 * - Group header with title, course/assignment context
 * - Members table with name, student ID, email, and (You) badge
 * - Breadcrumb navigation
 * - Error handling for access control (403/404)
 * - Loading states
 * - Keyboard navigation and ARIA support
 * - Empty/edge states handling
 */
export default function GroupDetails() {
  const { groupId } = useParams();
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadGroupDetails = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const groupData = await studentGroupsService.getCurrentUserGroupDetails(parseInt(groupId));
      setGroup(groupData);
    } catch (err) {
      console.error('Error loading group details:', err);
      setError({
        message: err.message || 'Failed to load group details',
        type: getErrorType(err)
      });
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroupDetails();
  }, [loadGroupDetails]);

  const getErrorType = (error) => {
    if (error.message?.includes("don't have access")) return 'forbidden';
    if (error.message?.includes("couldn't find")) return 'not_found';
    if (error.message?.includes("doesn't use group")) return 'not_eligible';
    if (error.message?.includes("information changed")) return 'stale_data';
    return 'general';
  };

  const generateMemberAvatar = (member) => {
    const initials = studentGroupsService.formatMemberForUI(member).initials;
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    const colorClass = colors[member.name.length % colors.length];
    
    return (
      <div className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${colorClass} text-white text-sm font-medium`}>
        {initials}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center space-x-2 text-sm">
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <span className="text-gray-400">/</span>
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <span className="text-gray-400">/</span>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading group details...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb (match overview style) */}
        <div className="mb-4">
          <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li className="flex items-center">
                <Link
                  href="/student"
                  className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors"
                >
                  <span className="font-bold text-blue-600 dark:text-blue-400 mr-1">OAS</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Dashboard</span>
                </Link>
              </li>
              <li className="flex items-center">
                <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
                <Link
                  href="/student/groups"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  My Groups
                </Link>
              </li>
            </ol>
          </nav>
        </div>

        <div className="bg-white dark:bg-gray-800 border-red-200 dark:border-red-800 border rounded-lg shadow p-6">
            <div className="text-center">
              {error.type === 'forbidden' && (
                <>
                  <i className="fas fa-lock text-4xl text-red-500 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Access Denied
                  </h3>
                </>
              )}
              {error.type === 'not_found' && (
                <>
                  <i className="fas fa-search text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Group Not Found
                  </h3>
                </>
              )}
              {error.type === 'not_eligible' && (
                <>
                  <i className="fas fa-info-circle text-4xl text-blue-500 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No Group Assignment
                  </h3>
                </>
              )}
              {error.type === 'stale_data' && (
                <>
                  <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Information Updated
                  </h3>
                </>
              )}
              {error.type === 'general' && (
                <>
                  <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Unable to Load Group
                  </h3>
                </>
              )}
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error.message}
              </p>
              
              <div className="space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => router.back()}
                  className="border-gray-300 hover:border-gray-400"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Go Back
                </Button>
                
                {error.type === 'stale_data' || error.type === 'general' ? (
                  <Button 
                    onClick={loadGroupDetails}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <i className="fas fa-redo mr-2"></i>
                    Try Again
                  </Button>
                ) : null}
              </div>
            </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <i className="fas fa-question-circle text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">No group information available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb (match overview style) */}
      <div className="mb-4">
        <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li className="flex items-center">
              <Link
                href="/student"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-1">OAS</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">Dashboard</span>
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
              <Link
                href="/student/groups"
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                My Groups
              </Link>
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
              {group.groupName}
            </h1>
            <div className="flex items-center space-x-4 text-blue-100">
              <span className="flex items-center">
                <i className="fas fa-book mr-2"></i>
                {group.courseCode}
              </span>
              <span className="flex items-center">
                <i className="fas fa-tasks mr-2"></i>
                {group.assignmentName}
              </span>
              <span className="flex items-center">
                <i className="fas fa-calendar mr-2"></i>
                {group.semester}
              </span>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-blue-600 shadow-lg">
              <i className="fas fa-users mr-2"></i>
              {group.members.length} Members
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Tips Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center mr-3 flex-shrink-0">
            <i className="fas fa-lightbulb text-amber-600 dark:text-amber-400"></i>
          </div>
          <div>
            <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
              Collaboration Tips
            </h3>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li className="flex items-start">
                <i className="fas fa-check-circle text-amber-600 mr-2 mt-0.5"></i>
                Use member contact information to coordinate group work and assignments
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-amber-600 mr-2 mt-0.5"></i>
                Establish regular communication schedules to keep everyone aligned
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-amber-600 mr-2 mt-0.5"></i>
                Share responsibilities evenly and respect each member's contributions
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div className="flex items-center space-x-2 mb-3 md:mb-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mr-4 flex items-center">
              <i className="fas fa-users text-blue-600 dark:text-blue-400 mr-2"></i>
              Group Members
            </h2>
          </div>
        </div>
        
        {group.members && group.members.length > 0 ? (
          <div className="space-y-4">
              {/* Desktop table view */}
              <div className="hidden md:block">
                <table className="w-full" role="table">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Member
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Student ID
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    {group.members.map((member) => {
                      const formattedMember = studentGroupsService.formatMemberForUI(member);
                      return (
                        <tr 
                          key={member.studentId} 
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                          role="row"
                        >
                          <td className="py-4 px-4" role="cell">
                            <div className="flex items-center">
                              {generateMemberAvatar(member)}
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {member.name}
                                  {member.isCurrentUser && (
                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      You
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400" role="cell">
                            {member.studentId}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400" role="cell">
                            <a 
                              href={`mailto:${member.email}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {member.email}
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden space-y-3">
                {group.members.map((member) => {
                  const formattedMember = studentGroupsService.formatMemberForUI(member);
                  return (
                    <div 
                      key={member.studentId}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center mb-3">
                        {generateMemberAvatar(member)}
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {member.name}
                          </div>
                          {member.isCurrentUser && (
                            <span className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div><strong>ID:</strong> {member.studentId}</div>
                        <div>
                          <strong>Email:</strong>
                          <a 
                            href={`mailto:${member.email}`}
                            className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {member.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Empty state for members - edge case handling
            <div className="text-center py-8">
              <i className="fas fa-user-friends text-3xl text-gray-400 mb-3"></i>
              <p className="text-gray-600 dark:text-gray-400">No members found</p>
            </div>
          )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="flex-1 sm:flex-none border-gray-300 hover:border-gray-400"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Groups
        </Button>
        
        <Button 
          onClick={loadGroupDetails}
          variant="outline"
          disabled={loading}
          className="flex-1 sm:flex-none text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
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
  );
}
