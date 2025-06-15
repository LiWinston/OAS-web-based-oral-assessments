'use client';

import Link from 'next/link';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';

export function StatsCard({ 
  title, 
  value, 
  icon, 
  actionText, 
  actionHref, 
  status = 'normal',
  subtitle 
}) {
  const statusStyles = {
    normal: 'text-gray-800 dark:text-gray-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
    success: 'text-green-800 dark:text-green-200',
    danger: 'text-red-800 dark:text-red-200'
  };

  const iconStyles = {
    normal: 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30',
    warning: 'bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30',
    success: 'bg-green-100 dark:bg-green-900 dark:bg-opacity-30',
    danger: 'bg-red-100 dark:bg-red-900 dark:bg-opacity-30'
  };

  const iconColors = {
    normal: 'text-blue-600 dark:text-blue-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    success: 'text-green-600 dark:text-green-400',
    danger: 'text-red-600 dark:text-red-400'
  };

  return (
    <Card className="dashboard-card bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            <p className={`text-2xl font-bold mt-1 ${statusStyles[status]}`}>
              {value}
            </p>
            {subtitle && (
              <div className="mt-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${iconStyles[status]}`}>
            <i className={`${icon} ${iconColors[status]}`}></i>
          </div>
        </div>
        
        {actionText && actionHref && (
          <div className="mt-4">
            <Link href={actionHref}>
              <Button variant="outline" size="sm" className="w-full">
                {actionText}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}