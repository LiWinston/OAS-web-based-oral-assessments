'use client';

import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

/**
 * ExaminerResults Component
 * 
 * Results and feedback management page for examiners to review
 * completed assessments and manage pending feedback submissions.
 */
export default function ExaminerResults() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Results & Feedback
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Review completed assessments and manage feedback submissions
          </p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button variant="outline">
            <i className="fas fa-filter mr-2"></i>
            Filter Results
          </Button>
          <Button>
            <i className="fas fa-download mr-2"></i>
            Export Results
          </Button>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card className="dashboard-card">
        <CardContent className="p-12 text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-6">
            <i className="fas fa-chart-bar text-6xl mb-4"></i>
            <h2 className="text-2xl font-semibold mb-2">Results Management</h2>
            <p className="text-lg">
              This feature is coming soon! You'll be able to:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            <div className="flex items-start space-x-3">
              <i className="fas fa-check-circle text-green-500 mt-1"></i>
              <span className="text-sm">View all completed assessments</span>
            </div>
            <div className="flex items-start space-x-3">
              <i className="fas fa-check-circle text-green-500 mt-1"></i>
              <span className="text-sm">Manage pending feedback submissions</span>
            </div>
            <div className="flex items-start space-x-3">
              <i className="fas fa-check-circle text-green-500 mt-1"></i>
              <span className="text-sm">Generate detailed assessment reports</span>
            </div>
            <div className="flex items-start space-x-3">
              <i className="fas fa-check-circle text-green-500 mt-1"></i>
              <span className="text-sm">Export results in multiple formats</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
