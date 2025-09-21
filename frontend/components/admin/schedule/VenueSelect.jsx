'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useVenues } from '@/hooks/useVenues.js';

export default function VenueSelect({ assignmentId, value = null, selectedName = '', onChange, placeholder = 'Select a venue', items = null }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  // Always fetch fresh list on mount/open to include newly created venues
  const { data: venuesQueryData, isLoading: isLoadingQuery, create, isCreating, refetch } = useVenues(assignmentId, '', { staleTime: 0, refetchOnMount: true });
  const venues = items ?? venuesQueryData;
  const isLoading = items ? false : isLoadingQuery;
  const containerRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Refetch when dropdown opens to ensure latest venues
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line no-console
      console.log('[VenueSelect] opened; refetching venues');
      refetch?.();
    }
  }, [open, refetch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q ? venues : venues.filter(v => v.name.toLowerCase().includes(q));
    // Console log for frontend filter action
    // eslint-disable-next-line no-console
    console.log('[VenueSelect] Frontend filter venues', {
      query: search,
      before: venues?.length || 0,
      after: list?.length || 0
    });
    return list;
  }, [venues, search]);

  const selected = useMemo(() => venues.find(v => v.id === value) || null, [venues, value]);

  const handleCreate = async () => {
    const name = search.trim();
    if (!name) return;
    // If exact name already exists for this assignment, use it instead of creating
    const existing = (venues || []).find(v => (v.name || '').trim() === name);
    if (existing) {
      // eslint-disable-next-line no-console
      console.log('[VenueSelect] Using existing venue instead of creating', existing);
      onChange?.(existing);
      setSearch('');
      setOpen(false);
      return;
    }

    // Optimistic select and close, then create and replace with real id
    onChange?.({ id: null, name });
    setSearch('');
    setOpen(false);
    // eslint-disable-next-line no-console
    console.log('[VenueSelect] Create venue (frontend)', { name });
    create(name, {
      onSuccess: (venue) => {
        // Replace optimistic value with actual venue from backend
        onChange?.(venue);
      }
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="custom-input bg-white dark:bg-white text-gray-900 flex items-center justify-between w-full"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={(selected || selectedName) ? '' : 'text-gray-500 dark:text-gray-400'}>
          {selected ? selected.name : (selectedName || placeholder)}
        </span>
        <i className="fas fa-chevron-down ml-2 text-gray-400" />
      </button>

      {open && (
        <div className="absolute mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
          {/* Search/Add row */}
          <div className="flex items-center p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              className="flex-1 custom-input bg-white dark:bg-white text-gray-900"
              placeholder="Search or add venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
            <button
              className="ml-2 px-2 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
              onClick={handleCreate}
              disabled={isCreating}
              title="Add venue"
            >
              <i className="fas fa-plus" />
            </button>
          </div>

          {/* Options */}
          <ul className="max-h-56 overflow-auto" role="listbox">
            {isLoading && (
              <li className="px-3 py-2 text-sm text-gray-500">Loading...</li>
            )}
            {!isLoading && filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">No venues found</li>
            )}
            {!isLoading && filtered.map((v) => (
              <li
                key={v.id}
                role="option"
                aria-selected={value === v.id}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${value === v.id ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                onClick={() => {
                  onChange?.(v);
                  setOpen(false);
                }}
              >
                {v.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
