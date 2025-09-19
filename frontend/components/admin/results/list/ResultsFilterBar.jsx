"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function ResultsFilterBar({ onFiltersChange, currentFilters = {} }) {
  const [localFilters, setLocalFilters] = useState(currentFilters);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    if (!value) delete newFilters[key];
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const clearFilters = () => {
    setLocalFilters({});
    onFiltersChange?.({});
  };

  const hasActive = Object.keys(localFilters).length > 0;

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Search by name..."
          value={localFilters.q || ''}
          onChange={(e) => handleFilterChange('q', e.target.value)}
        />
      </div>
      <div className="min-w-[180px]">
        <Select value={localFilters.entityKind || 'ALL'} onValueChange={(v) => handleFilterChange('entityKind', v === 'ALL' ? null : v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="INDIVIDUAL">Individual</SelectItem>
            <SelectItem value="GROUP">Group</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-[180px]">
        <Select value={localFilters.status || 'ALL'} onValueChange={(v) => handleFilterChange('status', v === 'ALL' ? null : v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="RELEASED">Released</SelectItem>
            <SelectItem value="REOPENED">Reopened</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-300">From</label>
        <Input type="date" value={localFilters.from || ''} onChange={(e) => handleFilterChange('from', e.target.value || null)} />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-300">To</label>
        <Input type="date" value={localFilters.to || ''} onChange={(e) => handleFilterChange('to', e.target.value || null)} />
      </div>
      {hasActive && (
        <div className="ml-auto">
          <Button variant="ghost" onClick={clearFilters}>Clear</Button>
        </div>
      )}
    </div>
  );
}
