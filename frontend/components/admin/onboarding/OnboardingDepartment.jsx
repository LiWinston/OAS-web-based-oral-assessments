'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, Check } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';

const DEPARTMENTS = [
  { value: 'economy', label: 'Economy' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'arts', label: 'Arts' },
  { value: 'medical', label: 'Medical' },
  { value: 'science', label: 'Science' }
];

export default function OnboardingDepartment({ data, onUpdate, onNext, onPrev }) {
  const [selectedDepartment, setSelectedDepartment] = useState(
    DEPARTMENTS.find(dept => dept.value === data.department) || null
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [error, setError] = useState('');

  const filteredDepartments = DEPARTMENTS.filter(dept =>
    dept.label.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedDepartment) {
      setError('Please select your department.');
      return;
    }
    
    onUpdate({ department: selectedDepartment.value });
    onNext();
  };

  const selectDepartment = (dept) => {
    setSelectedDepartment(dept);
    setIsDropdownOpen(false);
    setSearchFilter('');
    setError('');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
    if (!isDropdownOpen) {
      setSearchFilter('');
    }
  };

  return (
    <OnboardingLayout step={1} stepLabel="Select Department">
      <h1 
        className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center"
        style={{ fontWeight: 400 }}
      >
        Choose Your Department
      </h1>
      
      <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
        <div>
          <Label 
            htmlFor="department" 
            className="block text-sm text-gray-500 dark:text-gray-400 mb-1"
          >
            Department
          </Label>
          
          <div className="relative">
            <div
              className="flex items-center min-h-[48px] px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg cursor-pointer relative select-none"
              onClick={toggleDropdown}
              style={{ fontWeight: 300 }}
            >
              {selectedDepartment ? (
                <span className="text-gray-700 dark:text-gray-200">
                  {selectedDepartment.label}
                </span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 select-none">
                  Select your department...
                </span>
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
                  {filteredDepartments.map((dept) => (
                    <li
                      key={dept.value}
                      className="px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer text-sm text-gray-700 dark:text-gray-200 flex items-center"
                      onClick={() => selectDepartment(dept)}
                    >
                      <span className="flex-1">{dept.label}</span>
                      {selectedDepartment?.value === dept.value && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-300 ml-2" />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-red-500 dark:text-red-400 mt-2">
              {error}
            </div>
          )}
          
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Click the box to open the department list. You can search by typing, select your department by clicking. Only one department can be selected, and you can change your selection by choosing another option in the dropdown.
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
