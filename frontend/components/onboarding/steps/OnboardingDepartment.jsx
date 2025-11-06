'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2 } from 'lucide-react';
import OnboardingLayout from '../OnboardingLayout';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';

const DEFAULT_DEPARTMENTS = [
  'Engineering and IT',
  'Information Systems',
  'Business and Economics',
  'Medicine Dentistry and Health Sciences',
  'Arts and Humanities',
  'Education',
  'Law',
  'Science',
  'Architecture Building and Planning',
  'Veterinary and Agricultural Sciences',
];

export default function OnboardingDepartment({ data, onUpdate, onNext, onPrev }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(data.department || DEFAULT_DEPARTMENTS[0]);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return DEFAULT_DEPARTMENTS;
    const term = search.toLowerCase();
    return DEFAULT_DEPARTMENTS.filter((dept) => dept.toLowerCase().includes(term));
  }, [search]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selected) {
      setError('Please choose a department.');
      return;
    }
    onUpdate({ department: selected });
    onNext();
  };

  const handleSelect = (dept) => {
    setSelected(dept);
    setError('');
  };

  return (
    <OnboardingLayout step={1} stepLabel="Department" role="COURSE_ADMIN" maxSteps={4}>
      <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Select Your Department</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This helps us tailor the admin experience to your faculty structure.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="department-search" className="text-sm text-gray-600 dark:text-gray-400">
            Search departments
          </Label>
          <input
            id="department-search"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            placeholder="Start typing to filter..."
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((dept) => {
            const isActive = selected === dept;
            return (
              <button
                type="button"
                key={dept}
                onClick={() => handleSelect(dept)}
                className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-200'
                    : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:bg-gray-800'
                }`}
              >
                {dept}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No matches. Please adjust your search term.
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-200">
          <strong>Selected:</strong> {selected || 'None'}
        </div>

        <div className="mt-2 flex gap-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onPrev}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button type="submit" className="flex-1">
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
}

