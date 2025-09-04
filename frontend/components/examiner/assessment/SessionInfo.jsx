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

  const sessionTime = session ? formatDateTime(session.start) : {};
  const endTime = session ? new Date(session.end).toLocaleTimeString('en-AU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : '';

  return (
    <Card className="dashboard-card">
      <CardContent className="p-5">
        <div className="md:flex md:justify-between md:items-start">
          {/* Left column: Assessment Session Info */}
          <div className="mb-5 md:mb-0 md:mr-8 flex-1">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              {assignment?.name || 'Assessment Session'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {assignment?.rubricMeta?.description || 'Oral assessment session'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Assessment Type
                </div>
                <div className="font-medium capitalize">
                  {assignment?.type || 'Individual'} Assessment
                </div>
                {assignment?.type === 'mixed' && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Group: {(assignment.groupWeight * 100).toFixed(0)}% | 
                    Individual: {(assignment.individualWeight * 100).toFixed(0)}%
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Total Points
                </div>
                <div className="font-medium">
                  {assignment?.rubricMeta?.totalPoints || 100} points
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Weighted assessment
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Date & Time
                </div>
                <div className="font-medium">{sessionTime.date}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {sessionTime.time} - {endTime}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Location
                </div>
                <div className="font-medium">
                  {session?.venue?.room || 'Room TBD'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {session?.venue?.building || 'Building TBD'}
                </div>
              </div>

              {session?.coExaminers && session.coExaminers.length > 0 && (
                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Co-Examiners
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {session.coExaminers.map((examiner) => (
                      <Badge key={examiner.examinerId} variant="secondary">
                        <i className="fas fa-user-tie mr-1 text-xs"></i>
                        {examiner.name}
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
                {entity?.kind === 'GROUP' ? entity.group?.groupName : 'Individual Assessment'}
              </h3>
              {entity?.kind === 'GROUP' && (
                <Badge variant="default">
                  Group #{entity.group?.groupId}
                </Badge>
              )}
            </div>

            {entity?.kind === 'GROUP' && entity.group?.members && (
              <div className="space-y-2">
                {entity.group.members.map((member) => (
                  <div key={member.studentId} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 
                                  flex items-center justify-center text-white text-xs font-semibold mr-2">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="text-sm flex-1">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {member.studentId}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {entity?.kind === 'INDIVIDUAL' && entity.individuals && (
              <div className="space-y-2">
                {entity.individuals.slice(0, 1).map((student) => (
                  <div key={student.studentId} className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 
                                  flex items-center justify-center text-white text-sm font-semibold mr-3">
                      {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {student.studentId}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {student.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}