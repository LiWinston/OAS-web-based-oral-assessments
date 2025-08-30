'use client';

import { Card, CardContent } from '../../ui/card';
import { FileText, Clock, BookOpen } from 'lucide-react';

/**
 * Empty State Component for Results
 */
export default function ResultsEmptyState({ type = 'no-results', message }) {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-results':
        return {
          icon: <FileText className="w-12 h-12 text-gray-400 mb-4" />,
          title: 'No Results Available',
          description: message || 'When your assessments are graded and released, they will appear here.',
          bgColor: 'bg-gray-50 dark:bg-gray-800'
        };
      case 'loading':
        return {
          icon: <Clock className="w-12 h-12 text-blue-400 mb-4 animate-spin" />,
          title: 'Loading Results...',
          description: 'Please wait while we fetch your assessment results.',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        };
      case 'not-released':
        return {
          icon: <BookOpen className="w-12 h-12 text-yellow-400 mb-4" />,
          title: 'Results Pending',
          description: message || 'Your assessment has been completed. Results will be released soon.',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
        };
      default:
        return {
          icon: <FileText className="w-12 h-12 text-gray-400 mb-4" />,
          title: 'No Data Available',
          description: message || 'There is no information to display at this time.',
          bgColor: 'bg-gray-50 dark:bg-gray-800'
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <Card className={`${content.bgColor} border-dashed`}>
      <CardContent className="p-12">
        <div className="text-center">
          {content.icon}
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {content.title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {content.description}
          </p>
          
          {type === 'no-results' && (
            <div className="mt-6 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="text-left space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  What happens next?
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Complete your scheduled assessments
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Wait for examiners to submit their evaluations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Results will be released by your course coordinator
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    You'll receive an email notification when results are available
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}