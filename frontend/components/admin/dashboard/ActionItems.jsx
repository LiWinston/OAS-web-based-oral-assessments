'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';

// Mock action items - will be replaced with real data based on assignment states
const mockActionItems = [
  {
    id: 1,
    title: 'Configure Rubric for Data Structures Oral',
    description: 'Assignment setup is incomplete',
    priority: 'high',
    href: '/admin/assignments/1/rubric',
    icon: 'fas fa-exclamation-circle',
    dueDate: '2025-06-12'
  },
  {
    id: 2,
    title: 'Create Time Slots for Algorithm Presentations',
    description: 'Students waiting to book slots',
    priority: 'medium',
    href: '/admin/assignments/2/timeslots',
    icon: 'fas fa-calendar-plus',
    dueDate: '2025-06-14'
  },
  {
    id: 3,
    title: 'Invite Additional Examiner',
    description: 'Software Engineering needs 1 more examiner',
    priority: 'medium',
    href: '/admin/users',
    icon: 'fas fa-user-plus',
    dueDate: '2025-06-13'
  },
  {
    id: 4,
    title: 'Review Submitted Marks',
    description: '5 assessments awaiting review',
    priority: 'low',
    href: '/admin/assignments/3',
    icon: 'fas fa-clipboard-check',
    dueDate: '2025-06-16'
  }
];

const priorityStyles = {
  high: {
    dot: 'w-2 h-2 bg-red-500 rounded-full',
    border: 'border-l-2 border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20',
    badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
  },
  medium: {
    dot: 'w-2 h-2 bg-yellow-500 rounded-full',
    border: 'border-l-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20',
    badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
  },
  low: {
    dot: 'w-2 h-2 bg-blue-500 rounded-full',
    border: 'border-l-2 border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20',
    badge: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
  }
};

export function ActionItems() {
  const formatDueDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Overdue';
    return `${diffDays} days`;
  };

  return (
    <Card className="dashboard-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Action Items
          </CardTitle>
          <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
            {mockActionItems.filter(item => item.priority === 'high').length} urgent
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockActionItems.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-md ${priorityStyles[item.priority].border} hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-1">
                  <i className={`${item.icon} text-gray-500 dark:text-gray-400`}></i>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.title}
                    </p>
                    <div className={priorityStyles[item.priority].dot}></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Due: {formatDueDate(item.dueDate)}
                    </span>
                    <Link href={item.href}>
                      <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-6">
                        Action
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {mockActionItems.length === 0 && (
          <div className="text-center py-6">
            <div className="text-gray-500 dark:text-gray-400">
              <i className="fas fa-check-circle text-3xl mb-2 text-green-500"></i>
              <p className="text-sm">All caught up!</p>
              <p className="text-xs">No pending actions at the moment.</p>
            </div>
          </div>
        )}
        
        {mockActionItems.length > 4 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" className="w-full">
              View All Actions ({mockActionItems.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}