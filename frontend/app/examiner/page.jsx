'use client';

import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function ExaminerDashboard() {
  const { user, smartLogout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="bg-white shadow-sm border-b mb-6">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Examiner Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <Button onClick={smartLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user?.name}!</h2>
          <p className="text-gray-600">Manage your availability and conduct assessments.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">My Schedule</h3>
            <p className="text-gray-600 text-sm mb-4">Set availability for assessments</p>
            <Button variant="outline" className="w-full">Manage Schedule</Button>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Assessments</h3>
            <p className="text-gray-600 text-sm mb-4">Conduct oral examinations</p>
            <Button variant="outline" className="w-full">View Assessments</Button>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Comments</h3>
            <p className="text-gray-600 text-sm mb-4">Manage feedback templates</p>
            <Button variant="outline" className="w-full">Comment Library</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
