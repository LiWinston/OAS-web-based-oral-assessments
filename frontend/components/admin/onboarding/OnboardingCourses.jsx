'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, X } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';

const COURSE_OPTIONS = [
  { value: 'COMP90017', label: 'COMP90017 - SWEN90004' },
  { value: 'COMP90018', label: 'COMP90018 - Software Project Management' },
  { value: 'INFO90005', label: 'INFO90005 - Web Information Technologies' },
  { value: 'INFO90003', label: 'INFO90003 - Database Systems' },
  { value: 'COMP90019', label: 'COMP90019 - Cloud Computing' }
];

export default function OnboardingCourses({ data, onUpdate, onNext, onPrev }) {
  const [selectedCourses, setSelectedCourses] = useState(
    data.courses?.map(courseValue => 
      COURSE_OPTIONS.find(course => course.value === courseValue)
    ).filter(Boolean) || []
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const filteredCourses = COURSE_OPTIONS.filter(course =>
    course.label.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ courses: selectedCourses.map(course => course.value) });
    onNext();
  };

  const selectCourse = (course) => {
    if (!selectedCourses.find(selected => selected.value === course.value)) {
      setSelectedCourses(prev => [...prev, course]);
    }
  };

  const removeCourse = (courseToRemove) => {
    setSelectedCourses(prev => 
      prev.filter(course => course.value !== courseToRemove.value)
    );
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
    if (!isDropdownOpen) {
      setSearchFilter('');
    }
  };

  const isSelected = (course) => {
    return selectedCourses.some(selected => selected.value === course.value);
  };

  return (
    <OnboardingLayout step={2} stepLabel="Assign Courses">
      <h1 
        className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center"
        style={{ fontWeight: 400 }}
      >
        Assign Your Courses
      </h1>
      
      <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
        <div>
          <Label 
            htmlFor="courses" 
            className="block text-sm text-gray-500 dark:text-gray-400 mb-1"
          >
            Courses
          </Label>
          
          <div className="relative">
            <div
              className="flex flex-wrap gap-2 min-h-[48px] px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg cursor-pointer relative"
              onClick={toggleDropdown}
              style={{ fontWeight: 300 }}
            >
              {selectedCourses.length === 0 ? (
                <span className="text-gray-400 dark:text-gray-500 select-none py-1">
                  Select courses...
                </span>
              ) : (
                selectedCourses.map((course) => (
                  <span
                    key={course.value}
                    className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded px-2 py-1 text-xs font-medium mr-1 mb-1"
                  >
                    <span>{course.label}</span>
                    <button
                      type="button"
                      className="ml-1 focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCourse(course);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
              
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </span>
            </div>
            
            {isDropdownOpen && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-56 overflow-auto">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm focus:outline-none"
                  style={{ fontWeight: 300 }}
                  autoFocus
                />
                <ul className="py-1">
                  {filteredCourses.map((course) => (
                    <li
                      key={course.value}
                      className={`px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer text-sm text-gray-700 dark:text-gray-200 ${
                        isSelected(course) ? 'bg-blue-50 dark:bg-blue-800 text-blue-700 dark:text-blue-300' : ''
                      }`}
                      onClick={() => selectCourse(course)}
                    >
                      {course.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Click the box to open the course list. You can search by typing, select multiple courses by clicking, and remove selected courses by clicking the <X className="inline w-3 h-3" /> on each tag. The dropdown will stay open for multiple selections.
          </p>
        </div>
        
        <div className="flex justify-between gap-4 mt-2">
          <Button
            type="button"
            onClick={onPrev}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl shadow hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
            style={{ fontWeight: 400 }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          <Button
            type="submit"
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition font-medium flex items-center justify-center gap-2"
            style={{ fontWeight: 400 }}
          >
            Next<ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
