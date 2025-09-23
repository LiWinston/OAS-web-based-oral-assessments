'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useGlobalSearchStore } from '@/store/globalSearchStore';

const isInputLikeElement = (element) => {
  if (!element) return false;
  const tag = element.tagName?.toLowerCase();
  const editable = element.isContentEditable;
  const inputTypes = ['input', 'textarea', 'select'];
  return editable || inputTypes.includes(tag);
};

const matchItems = (items, query) => {
  if (!query) return items;

  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;

  return items.filter((item) => {
    return [item.title, item.subtitle, item.keywords]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalized));
  });
};

const filterSection = (section, query) => {
  if (!section) return null;
  const items = Array.isArray(section.items) ? section.items : [];
  const filteredItems = matchItems(items, query);
  const limit = query
    ? section.queryLimit ?? filteredItems.length
    : section.defaultLimit ?? filteredItems.length;
  const limitedItems = typeof limit === 'number' && limit >= 0
    ? filteredItems.slice(0, limit || filteredItems.length)
    : filteredItems;

  if (limitedItems.length === 0) {
    if (section.alwaysVisible && !query) {
      return {
        ...section,
        items: limitedItems,
      };
    }
    return null;
  }

  return {
    ...section,
    items: limitedItems,
  };
};

const flattenSections = (sections) => {
  const flat = [];
  sections.forEach((section) => {
    section.items.forEach((item) => {
      flat.push({ section: section.id, item });
    });
  });
  return flat;
};

export function GlobalSearchPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const isOpen = useGlobalSearchStore((state) => state.isOpen);
  const setOpen = useGlobalSearchStore((state) => state.setOpen);
  const query = useGlobalSearchStore((state) => state.query);
  const setQuery = useGlobalSearchStore((state) => state.setQuery);
  const loading = useGlobalSearchStore((state) => state.loading);
  const error = useGlobalSearchStore((state) => state.error);
  const sections = useGlobalSearchStore((state) => state.sections);

  const sectionData = useMemo(() => {
    if (!Array.isArray(sections)) return [];
    return sections
      .map((section) => filterSection(section, query))
      .filter(Boolean);
  }, [sections, query]);

  const allItems = useMemo(() => flattenSections(sectionData), [sectionData]);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, [setOpen, setQuery]);

  const handleSelect = useCallback(
    (link) => {
      if (!link?.href) return;
      router.push(link.href);
      closePalette();
    },
    [closePalette, router]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented) return;

      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (isOpen) {
          closePalette();
        } else {
          setOpen(true);
        }
      }

      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          closePalette();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prev) => {
            if (allItems.length === 0) return prev;
            return (prev + 1) % allItems.length;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) => {
            if (allItems.length === 0) return prev;
            return (prev - 1 + allItems.length) % allItems.length;
          });
          break;
        case 'Enter':
          if (allItems.length === 0) return;
          event.preventDefault();
          const target = allItems[highlightedIndex]?.item;
          if (target) {
            handleSelect(target);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allItems, highlightedIndex, isOpen, closePalette, handleSelect, setOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (isInputLikeElement(document.activeElement)) {
      // Let native inputs keep focus unless palette is explicitly open
    }

    const timer = requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    });

    return () => cancelAnimationFrame(timer);
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [sections]);

  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpenRef.current) return;
    closePalette();
  }, [pathname, closePalette]);

  const renderSection = (section, startIndex) => {
    return (
      <div key={section.id} className="mt-4 first:mt-0">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
          {section.label}
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden">
          {section.items.map((item, index) => {
            const flatIndex = startIndex + index;
            const isActive = highlightedIndex === flatIndex;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setHighlightedIndex(flatIndex)}
                onClick={() => handleSelect(item)}
                className={`w-full flex flex-col items-start px-4 py-3 text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-100'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-sm font-medium">{item.title}</span>
                {item.subtitle && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {item.subtitle}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return null;
  }

  let runningIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 backdrop-blur-sm bg-black/30"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <span className="text-gray-400 mr-3">
              <i className="fas fa-search" aria-hidden="true"></i>
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses, assignments, or actions"
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 outline-none"
              aria-label="Global search"
            />
            <div className="text-xs text-gray-400 dark:text-gray-500 ml-3">⌘K</div>
          </div>
        </div>

        <div
          className="max-h-96 overflow-y-auto px-4 py-4"
          role="listbox"
          aria-live="polite"
        >
          {loading && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Loading shortcuts…
            </div>
          )}

          {!loading && error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && allItems.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No matches. Try different keywords.
            </div>
          )}

          {!loading && !error &&
            sectionData.map((section) => {
              const rendered = renderSection(section, runningIndex);
              runningIndex += section.items.length;
              return rendered;
            })}
        </div>
      </div>
    </div>
  );
}

export default GlobalSearchPalette;
