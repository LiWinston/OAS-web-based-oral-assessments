'use client';

import { useState, useEffect } from 'react';
import { Input } from '../../ui/input';
// Use native select for simplicity here
import { Button } from '../../ui/button';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'RELEASED', label: 'Released' },
];

export default function ResultsFilters({ value, onChange }) {
  const [local, setLocal] = useState(value || {});

  useEffect(() => { setLocal(value || {}); }, [value]);

  const apply = () => { onChange?.(local); };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Search</label>
          <Input
            placeholder="Assignment, group, student..."
            value={local.q || ''}
            onChange={(e) => setLocal((prev) => ({ ...prev, q: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Status</label>
          <select
            className="border-input dark:bg-input/30 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
            value={local.status || 'all'}
            onChange={(e) => setLocal((prev) => ({ ...prev, status: e.target.value }))}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
            <Input type="date" value={local.from || ''} onChange={(e) => setLocal((p) => ({ ...p, from: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
            <Input type="date" value={local.to || ''} onChange={(e) => setLocal((p) => ({ ...p, to: e.target.value }))} />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => { setLocal({ status: 'all' }); onChange?.({}); }}>Reset</Button>
        <Button onClick={apply}>Apply</Button>
      </div>
    </div>
  );
}
