'use client';

import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';

/**
 * SessionInfo Component
 * Displays session details including assignment info, timing, location, and participants
 */
export default function SessionInfo({ sessionContext }) {
  const { assignment, session, entity } = sessionContext || {};
  
  if (!sessionContext) {
    return null;
  }

  const rubric = assignment?.rubric;
  const weightBasis = rubric?.weightBasis || 'percentage';
  const criteria = rubric?.criteria || [];
  const hasGroupBucket = criteria.some((c) => {
    const applies = (c.appliesTo || 'BOTH').toUpperCase();
    return applies === 'GROUP' || applies === 'BOTH';
  });
  const hasIndividualBucket = criteria.some((c) => {
    const applies = (c.appliesTo || 'BOTH').toUpperCase();
    return applies === 'INDIVIDUAL' || applies === 'BOTH';
  });
  const bucketWeights = assignment?.weights || {};
  const groupWeight = Number(bucketWeights.group ?? assignment?.groupWeight ?? 0);
  const individualWeight = Number(bucketWeights.individual ?? assignment?.individualWeight ?? 0);

  const groupInfo = entity?.group;
  const individuals = Array.isArray(entity?.individuals) ? entity.individuals : [];

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-AU', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-AU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const sessionTime = (session && session.start) ? formatDateTime(session.start) : {};
  const endTime = (session && session.end) ? new Date(session.end).toLocaleTimeString('en-AU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : '';

  const getInitials = (name, fallback = '??') => {
    if (!name || typeof name !== 'string') return fallback;
    const segments = name.trim().split(/\s+/);
    if (!segments.length) return fallback;
    return segments.map((seg) => seg[0]?.toUpperCase() || '').join('').slice(0, 2) || fallback;
  };

  return (
    <Card className="dashboard-card">
      <CardContent className="p-5">
        <div className="md:flex md:justify-between md:items-start">
          {/* Left column: Assessment Timeslot Info */}
          <div className="mb-5 md:mb-0 md:mr-8 flex-1">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              {assignment?.name || 'Assessment Timeslot'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {rubric?.description || 'Oral assessment timeslot'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Rubric Buckets
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {hasGroupBucket ? 'Group Criteria' : '—'}{hasGroupBucket && hasIndividualBucket ? ' • ' : ''}{hasIndividualBucket ? 'Individual Criteria' : (!hasGroupBucket ? '—' : '')}
                </div>
                {(hasGroupBucket || hasIndividualBucket) && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {hasGroupBucket && (
                      <span>
                        Group {weightBasis === 'points' ? `${groupWeight} pts` : `${groupWeight}%`}
                        {hasIndividualBucket ? ' | ' : ''}
                      </span>
                    )}
                    {hasIndividualBucket && (
                      <span>
                        Individual {weightBasis === 'points' ? `${individualWeight} pts` : `${individualWeight}%`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Total Points
                </div>
                <div className="font-medium">
                  {rubric?.totalPoints || 100} points
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Weighted assessment
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Date & Time
                </div>
                <div className="font-medium">{sessionTime.date || 'Date TBD'}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {(sessionTime.time && endTime) ? `${sessionTime.time} - ${endTime}` : 'Time TBD'}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Location
                </div>
                {session?.venue?.venueName ? (
                  <div className="font-medium">{session.venue.venueName}</div>
                ) : (
                  <>
                    <div className="font-medium">{session?.venue?.room || 'Room TBD'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {session?.venue?.building || 'Building TBD'}
                    </div>
                  </>
                )}
              </div>

              {session?.coExaminers && session.coExaminers.length > 0 && (
                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Co-Examiners
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {session.coExaminers.map((examiner, idx) => (
                      <Badge key={examiner.examinerId || examiner.id || idx} variant="secondary">
                        <i className="fas fa-user-tie mr-1 text-xs"></i>
                        {examiner.name || examiner.fullName || 'Examiner'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Student/Group Info */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg md:w-80">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                {groupInfo ? (groupInfo.groupName || `Group ${groupInfo.groupId}`) : 'Individual Assessments'}
              </h3>
              {groupInfo && (
                <Badge variant="default">
                  Group #{groupInfo.groupId}
                </Badge>
              )}
            </div>

            {groupInfo && Array.isArray(groupInfo.members) && groupInfo.members.length > 0 && (
              <div className="space-y-2">
                {groupInfo.members.map((member, idx) => {
                  const displayName =
                    member?.name ||
                    member?.studentName ||
                    member?.fullName ||
                    (member?.studentId ? `Student ${member.studentId}` : 'Student');
                  const key =
                    member?.studentId ??
                    member?.userId ??
                    member?.email ??
                    `${displayName || 'member'}-${idx}`;
                  return (
                  <div key={key} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 
                                  flex items-center justify-center text-white text-xs font-semibold mr-2">
                      {getInitials(displayName, 'GR')}
                    </div>
                    <div className="text-sm flex-1">
                      <div className="font-medium">{displayName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {member?.studentId ?? member?.userId ?? '—'}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {!groupInfo && individuals.length > 0 && (
              <div className="space-y-2">
                {individuals.slice(0, 1).map((student, idx) => {
                  const displayName =
                    student?.name ||
                    student?.studentName ||
                    student?.fullName ||
                    (student?.studentId ? `Student ${student.studentId}` : 'Student');
                  const key =
                    student?.studentId ??
                    student?.userId ??
                    student?.email ??
                    `${displayName || 'student'}-${idx}`;
                  return (
                  <div key={key} className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 
                                  flex items-center justify-center text-white text-sm font-semibold mr-3">
                      {getInitials(displayName, 'ST')}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{displayName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {student?.studentId ?? student?.userId ?? '—'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {student?.email || ''}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
