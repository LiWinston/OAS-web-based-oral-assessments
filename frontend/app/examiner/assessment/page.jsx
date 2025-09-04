'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '../../../hooks/useAuth';
import { useNotification } from '../../../hooks/useNotification';
import examinerAssessmentService from '../../../services/examinerAssessmentService';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';

export default function ExaminerAssessmentSessions() {
  const router = useRouter();
  const { user, userId } = useAuth();
  const { showNotification } = useNotification();

  const [availableSessions, setAvailableSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    const exId = userId || user?.id;
    if (!exId) return;
    (async () => {
      setLoadingSessions(true);
      try {
        // In mocks, fetch 3 assignments to showcase mixed, individual, and group
        const ids = [101, 102, 103];
        const results = await Promise.all(
          ids.map((id) =>
            examinerAssessmentService.getMarkingSessions(exId, id, { status: 'upcoming' })
          )
        );
        const merged = [];
        for (const r of results) {
          if (r?.success && r?.data?.sessions) {
            const { assignment } = r.data;
            merged.push(
              ...r.data.sessions.map((s) => ({
                ...s,
                __assignmentId: assignment.id,
                __assignmentName: assignment.name,
                __assignmentType: assignment.type,
              }))
            );
          }
        }
        setAvailableSessions(merged);
      } catch (e) {
        showNotification('error', 'Error loading sessions');
      } finally {
        setLoadingSessions(false);
      }
    })();
  }, [user, userId, showNotification]);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-AU', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loadingSessions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Assessment Sessions</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select a session to begin assessment</p>
        </div>
      </div>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>
            <i className="fas fa-clipboard-list text-blue-600 mr-2"></i>
            Available Sessions to Assess
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            These are your upcoming assessment sessions with booked students
          </p>
        </CardHeader>
        <CardContent>
          {availableSessions.length > 0 ? (
            <div className="space-y-3">
              {availableSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {formatDateTime(session.start)} - {new Date(session.end).toLocaleTimeString('en-AU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {session.__assignmentType && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                            {session.__assignmentType.toUpperCase()}
                          </Badge>
                        )}
                        {session.status === 'draft' && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800">Draft</Badge>
                        )}
                        {session.status === 'submitted' && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800">Submitted</Badge>
                        )}
                        {session.status === 'unmarked' && (
                          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">Not Started</Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center mb-1">
                          <i className="fas fa-tasks text-purple-600 mr-2"></i>
                          {session.__assignmentName || 'Assessment'}
                        </div>
                        <div className="flex items-center mb-1">
                          <i className="fas fa-users text-blue-600 mr-2"></i>
                          {session.entity.kind === 'GROUP'
                            ? `Group Assessment - ${session.entity.members} members`
                            : `Individual Assessment`}
                        </div>
                        {session.coExaminers && session.coExaminers.length > 0 && (
                          <div className="flex items-center">
                            <i className="fas fa-user-tie text-purple-600 mr-2"></i>
                            Co-examiner: {session.coExaminers.map((e) => e.name).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button onClick={() => router.push(`/examiner/assessment/${session.sessionId}`)} variant="default">
                      {session.status === 'submitted' ? (
                        <>
                          <i className="fas fa-eye mr-2"></i>
                          View Assessment
                        </>
                      ) : session.status === 'draft' ? (
                        <>
                          <i className="fas fa-edit mr-2"></i>
                          Continue Assessment
                        </>
                      ) : (
                        <>
                          <i className="fas fa-play mr-2"></i>
                          Start Assessment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-calendar-times text-gray-400 dark:text-gray-500 text-3xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">No Sessions Available</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">You don't have any assessment sessions scheduled yet.</p>
              <Button onClick={() => router.push('/examiner/schedule')}>Go to Schedule</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
