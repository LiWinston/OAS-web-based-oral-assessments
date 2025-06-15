'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';

// Mock calendar events - will be replaced with real data
const mockEvents = [
  {
    date: '2025-06-08',
    title: 'Data Structures Oral',
    type: 'exam',
    time: '10:00 AM'
  },
  {
    date: '2025-06-10',
    title: 'Algorithm Presentations',
    type: 'presentation',
    time: '2:00 PM'
  },
  {
    date: '2025-06-15',
    title: 'Software Engineering Viva',
    type: 'viva',
    time: '9:00 AM'
  }
];

const eventColors = {
  exam: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-l-2 border-blue-500',
  presentation: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-l-2 border-green-500',
  viva: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-l-2 border-purple-500'
};

export function SimpleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get current month details
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  
  // Generate calendar days
  const calendarDays = [];
  
  // Previous month's trailing days
  for (let i = 0; i < firstDay; i++) {
    const prevDate = new Date(year, month, 0 - (firstDay - 1 - i));
    calendarDays.push({
      date: prevDate.getDate(),
      isCurrentMonth: false,
      fullDate: prevDate.toISOString().split('T')[0]
    });
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const fullDate = new Date(year, month, day).toISOString().split('T')[0];
    calendarDays.push({
      date: day,
      isCurrentMonth: true,
      isToday: fullDate === today.toISOString().split('T')[0],
      fullDate
    });
  }
  
  // Next month's leading days to fill the grid
  const remainingCells = 42 - calendarDays.length; // 6 rows × 7 days
  for (let day = 1; day <= remainingCells; day++) {
    const nextDate = new Date(year, month + 1, day);
    calendarDays.push({
      date: day,
      isCurrentMonth: false,
      fullDate: nextDate.toISOString().split('T')[0]
    });
  }
  
  // Get events for a specific date
  const getEventsForDate = (date) => {
    return mockEvents.filter(event => event.date === date);
  };
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <Card className="dashboard-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Assignment Calendar
          </CardTitle>
          <div className="flex space-x-2">
            <Button onClick={goToPreviousMonth} variant="outline" size="sm">
              <i className="fas fa-chevron-left"></i>
            </Button>
            <Button onClick={goToToday} variant="outline" size="sm" className="px-3">
              {monthName}
            </Button>
            <Button onClick={goToNextMonth} variant="outline" size="sm">
              <i className="fas fa-chevron-right"></i>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.slice(0, 35).map((day, index) => {
            const events = getEventsForDate(day.fullDate);
            return (
              <div
                key={index}
                className={`calendar-day min-h-[4rem] border border-gray-200 dark:border-gray-700 p-1 relative ${
                  day.isCurrentMonth 
                    ? day.isToday 
                      ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' 
                      : 'bg-white dark:bg-gray-800'
                    : 'bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <div className={`text-xs mb-1 ${
                  day.isCurrentMonth 
                    ? day.isToday 
                      ? 'text-blue-800 dark:text-blue-300 font-medium' 
                      : 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {day.date}
                </div>
                
                {/* Events */}
                {events.map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className={`calendar-event text-xs p-1 mb-1 rounded ${eventColors[event.type]} cursor-pointer hover:opacity-80`}
                    title={`${event.title} at ${event.time}`}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        
        {/* Calendar legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-blue-100 dark:bg-blue-900 border-l-2 border-blue-500 inline-block mr-1"></span>
            <span className="text-gray-600 dark:text-gray-400">Oral Exams</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-100 dark:bg-green-900 border-l-2 border-green-500 inline-block mr-1"></span>
            <span className="text-gray-600 dark:text-gray-400">Presentations</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-purple-100 dark:bg-purple-900 border-l-2 border-purple-500 inline-block mr-1"></span>
            <span className="text-gray-600 dark:text-gray-400">Viva Voce</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}