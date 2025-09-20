'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

/**
 * RoleWidgetGrid Component
 *
 * Renders role-specific widgets based on backend payload data.
 * Maps widget keys to specific components and handles empty states.
 */
export default function RoleWidgetGrid({ widgets = [], userRole, onWidgetAction }) {
  const renderWidget = (widget) => {
    const { key, title, description, payload } = widget;

    switch (key) {
      case 'student.nextSession':
        return <StudentNextSessionWidget key={key} title={title} description={description} data={payload} onAction={onWidgetAction} />;
      case 'student.recentSessions':
        return <StudentRecentSessionsWidget key={key} title={title} description={description} data={payload} onAction={onWidgetAction} />;
      case 'examiner.nextSession':
        return <ExaminerNextSessionWidget key={key} title={title} description={description} data={payload} onAction={onWidgetAction} />;
      case 'examiner.recentSessions':
        return <ExaminerRecentSessionsWidget key={key} title={title} description={description} data={payload} onAction={onWidgetAction} />;
      case 'admin.managedCourses':
        return <AdminManagedCoursesWidget key={key} title={title} description={description} data={payload} onAction={onWidgetAction} />;
      case 'admin.pendingTasks':
        return <AdminPendingTasksWidget key={key} title={title} description={description} data={payload} onAction={onWidgetAction} />;
      case 'superadmin.pendingApprovals':
        return <SuperAdminApprovalsWidget key={key} title={title} description={description} data={payload} onAction={onWidgetAction} />;
      case 'superadmin.systemMetrics':
        return <SuperAdminMetricsWidget key={key} title={title} description={description} data={payload} onAction={onWidgetAction} />;
      default:
        return <GenericWidget key={key} title={title} description={description} data={payload} />;
    }
  };

  if (!widgets || widgets.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-widgets text-2xl text-gray-400"></i>
        </div>
        <p className="text-gray-500 dark:text-gray-400">No widgets available for your role</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {widgets.map(renderWidget)}
    </div>
  );
}

// Student Widgets
function StudentNextSessionWidget({ title, description, data, onAction }) {
  if (!data || !data.session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-calendar-clock mr-2 text-blue-600"></i>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-calendar-check text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 dark:text-gray-400">{description || 'No upcoming sessions'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { session } = data;
  const startDate = new Date(session.startAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-calendar-clock mr-2 text-blue-600"></i>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-lg">{session.assignmentName}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {startDate.toLocaleDateString('en-AU', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.venue && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <i className="fas fa-map-marker-alt mr-1"></i>
                {session.venue}
              </span>
            )}
            {session.examiner && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <i className="fas fa-user-tie mr-1"></i>
                {session.examiner}
              </span>
            )}
          </div>
          <Button onClick={() => onAction?.('booking')} className="w-full">
            <i className="fas fa-calendar-edit mr-2"></i>
            Manage Booking
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentRecentSessionsWidget({ title, description, data, onAction }) {
  if (!data || !data.sessions || data.sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-history mr-2 text-green-600"></i>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 dark:text-gray-400">{description || 'No recent sessions'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <i className="fas fa-history mr-2 text-green-600"></i>
            {title}
          </span>
          <Button variant="ghost" size="sm" onClick={() => onAction?.('results')}>
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.sessions.slice(0, 3).map((session, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h5 className="font-medium">{session.assignmentName}</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(session.completedAt || session.startAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                session.status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
              }`}>
                {session.status === 'COMPLETED' ? 'Results Available' : 'Awaiting Results'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Examiner Widgets
function ExaminerNextSessionWidget({ title, description, data, onAction }) {
  if (!data || !data.session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-chalkboard-teacher mr-2 text-purple-600"></i>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-calendar-check text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 dark:text-gray-400">{description || 'No upcoming sessions'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { session } = data;
  const startDate = new Date(session.startAt);
  const now = new Date();
  const diffTime = startDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-chalkboard-teacher mr-2 text-purple-600"></i>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-lg">{session.assignmentName}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {startDate.toLocaleDateString('en-AU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            {diffDays >= 0 && (
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {session.venue && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                <i className="fas fa-map-marker-alt mr-1"></i>
                {session.venue}
              </span>
            )}
            {session.studentCount && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <i className="fas fa-users mr-1"></i>
                {session.studentCount} students
              </span>
            )}
          </div>
          <Button onClick={() => onAction?.('schedule')} className="w-full">
            <i className="fas fa-calendar-alt mr-2"></i>
            Go to Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ExaminerRecentSessionsWidget({ title, description, data, onAction }) {
  if (!data || !data.sessions || data.sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-clipboard-check mr-2 text-orange-600"></i>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-chalkboard text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 dark:text-gray-400">{description || 'No recent sessions'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <i className="fas fa-clipboard-check mr-2 text-orange-600"></i>
            {title}
          </span>
          <Button variant="ghost" size="sm" onClick={() => onAction?.('results')}>
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.sessions.slice(0, 3).map((session, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h5 className="font-medium">{session.assignmentName}</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(session.completedAt || session.startAt).toLocaleDateString()}
                </p>
                {session.studentName && (
                  <p className="text-xs text-gray-500">{session.studentName}</p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => onAction?.('feedback', session.id)}>
                <i className="fas fa-edit mr-1"></i>
                Feedback
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Admin Widgets
function AdminManagedCoursesWidget({ title, description, data, onAction }) {
  if (!data || !data.courses || data.courses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-graduation-cap mr-2 text-indigo-600"></i>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-university text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 dark:text-gray-400">{description || 'No managed courses'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <i className="fas fa-graduation-cap mr-2 text-indigo-600"></i>
            {title}
          </span>
          <Button variant="ghost" size="sm" onClick={() => onAction?.('courses')}>
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.courses.slice(0, 3).map((course, index) => (
            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium">{course.subjectCode}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{course.name}</p>
                </div>
                {course.unstaffedSessions > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {course.unstaffedSessions} unstaffed
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">{course.assignmentCount} assignments</span>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${course.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AdminPendingTasksWidget({ title, description, data, onAction }) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-tasks mr-2 text-red-600"></i>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 dark:text-gray-400">{description || 'No pending tasks'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tasks = [
    {
      key: 'unstaffedSessions',
      label: 'Unstaffed Sessions',
      count: data.unstaffedSessions || 0,
      icon: 'fa-user-slash',
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    },
    {
      key: 'openSessions',
      label: 'Open Sessions',
      count: data.openSessions || 0,
      icon: 'fa-calendar-plus',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20'
    },
    {
      key: 'assignmentsPending',
      label: 'Assignments Pending',
      count: data.assignmentsPending || 0,
      icon: 'fa-clock',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-tasks mr-2 text-red-600"></i>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {tasks.map((task) => (
            <div
              key={task.key}
              className={`p-3 rounded-lg ${task.bgColor} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => onAction?.(task.key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <i className={`fas ${task.icon} ${task.color} mr-3`}></i>
                  <span className="text-sm font-medium">{task.label}</span>
                </div>
                <span className={`text-lg font-bold ${task.color}`}>
                  {task.count}
                </span>
              </div>
            </div>
          ))}
        </div>
        {data.assignmentsPending > 0 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Canvas export pending for assignments
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Super Admin Widgets
function SuperAdminApprovalsWidget({ title, description, data, onAction }) {
  if (!data || typeof data.pendingCount !== 'number') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-user-check mr-2 text-green-600"></i>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-clipboard-check text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 dark:text-gray-400">{description || 'No pending approvals'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-user-check mr-2 text-green-600"></i>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {data.pendingCount}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {data.pendingCount === 1 ? 'Pending approval' : 'Pending approvals'}
          </p>
          <Button onClick={() => onAction?.('approvals')} className="w-full">
            <i className="fas fa-eye mr-2"></i>
            Review Requests
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SuperAdminMetricsWidget({ title, description, data, onAction }) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-chart-bar mr-2 text-purple-600"></i>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-chart-line text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 dark:text-gray-400">{description || 'No metrics available'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      key: 'activeCourses',
      label: 'Active Courses',
      value: data.activeCourses || 0,
      icon: 'fa-graduation-cap',
      color: 'text-blue-600'
    },
    {
      key: 'newUsers7d',
      label: 'New Users (7d)',
      value: data.newUsers7d || 0,
      icon: 'fa-user-plus',
      color: 'text-green-600'
    },
    {
      key: 'totalUsers',
      label: 'Total Users',
      value: data.totalUsers || 0,
      icon: 'fa-users',
      color: 'text-purple-600'
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-chart-bar mr-2 text-purple-600"></i>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {metrics.map((metric) => (
            <div key={metric.key} className="flex items-center justify-between">
              <div className="flex items-center">
                <i className={`fas ${metric.icon} ${metric.color} mr-3`}></i>
                <span className="text-sm font-medium">{metric.label}</span>
              </div>
              <span className={`text-lg font-bold ${metric.color}`}>
                {metric.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={() => onAction?.('metrics')}
          className="w-full mt-4"
        >
          <i className="fas fa-chart-line mr-2"></i>
          View Detailed Metrics
        </Button>
      </CardContent>
    </Card>
  );
}

// Generic fallback widget
function GenericWidget({ title, description, data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-cube mr-2 text-gray-600"></i>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <i className="fas fa-cog text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 dark:text-gray-400">
            {description || 'Widget data not available'}
          </p>
          {data && (
            <pre className="mt-4 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </CardContent>
    </Card>
  );
}