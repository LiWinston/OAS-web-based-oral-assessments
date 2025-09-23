'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useGlobalSearchStore } from '@/store/globalSearchStore';
import { useAuthStore } from '@/store/authStore';
import {
  addRecent,
  toggleFavourite,
  getFavourites,
  getRecents,
} from '@/search/persistence';

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

const resolveUserId = (user) =>
  user?.id ?? user?.userId ?? user?.adminId ?? user?.examinerId ?? user?.studentId;

const itemsEqual = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (!left || !right) return false;
    if (
      left.id !== right.id ||
      left.href !== right.href ||
      left.title !== right.title ||
      left.subtitle !== right.subtitle ||
      Boolean(left.isFavourite) !== Boolean(right.isFavourite)
    ) {
      return false;
    }
  }
  return true;
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
  const setSectionsState = useGlobalSearchStore((state) => state.setSections);
  const user = useAuthStore((state) => state.user);

  const role = user?.role;
  const userId = resolveUserId(user);

  const hasFavouritesSection = useMemo(
    () => sections.some((section) => section?.id?.endsWith('.favourites')),
    [sections]
  );

  const hasRecentsSection = useMemo(
    () => sections.some((section) => section?.id?.endsWith('.recents')),
    [sections]
  );

  const enablePersistence = Boolean(role && userId && (hasFavouritesSection || hasRecentsSection));

  const shouldAllowFavourite = enablePersistence && hasFavouritesSection;
  const shouldRecordRecent = enablePersistence && hasRecentsSection;

  const syncSections = useCallback(
    ({ favouritesList, recentsList } = {}) => {
      if (!enablePersistence) return;

      setSectionsState((prevSections) => {
        const favouritesSectionExists = prevSections.some((section) => section?.id?.endsWith('.favourites'));
        const recentsSectionExists = prevSections.some((section) => section?.id?.endsWith('.recents'));

        if (!favouritesSectionExists && !recentsSectionExists) {
          return prevSections;
        }

        const resolvedFavourites = favouritesSectionExists
          ? favouritesList ?? getFavourites(role, userId)
          : [];
        const favouritesSet = new Set(resolvedFavourites.map((item) => item.id));
        const resolvedRecents = recentsSectionExists
          ? recentsList ?? getRecents(role, userId)
          : [];

        let mutated = false;

        const nextSections = prevSections.map((section) => {
          if (favouritesSectionExists && section?.id?.endsWith('.favourites')) {
            const items = resolvedFavourites.map((item) => ({
              ...item,
              allowFavourite: true,
              isFavourite: true,
            }));
            if (!itemsEqual(section.items, items)) {
              mutated = true;
              return { ...section, items };
            }
            return section;
          }

          if (recentsSectionExists && section?.id?.endsWith('.recents')) {
            const items = resolvedRecents.map((item) => ({
              ...item,
              allowFavourite: true,
              isFavourite: favouritesSet.has(item.id),
            }));
            if (!itemsEqual(section.items, items)) {
              mutated = true;
              return { ...section, items };
            }
            return section;
          }

          if (!Array.isArray(section.items) || section.items.length === 0) {
            return section;
          }

          let sectionMutated = false;
          const nextItems = section.items.map((item) => {
            if (!item || !item.allowFavourite) {
              return item;
            }
            const favouriteState = favouritesSet.has(item.id);
            if (item.isFavourite === favouriteState) {
              return item;
            }
            sectionMutated = true;
            return { ...item, isFavourite: favouriteState };
          });

          if (sectionMutated) {
            mutated = true;
            return { ...section, items: nextItems };
          }

          return section;
        });

        return mutated ? nextSections : prevSections;
      });
    },
    [enablePersistence, role, userId, setSectionsState]
  );

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
    (link, sectionId) => {
      if (!link?.href) return;

      if (shouldRecordRecent) {
        const payload = { ...link, sectionId: sectionId ?? link?.sectionId };
        const recents = addRecent(role, userId, payload);
        syncSections({ recentsList: recents });
      }

      router.push(link.href);
      closePalette();
    },
    [closePalette, router, shouldRecordRecent, role, userId, syncSections]
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
          const targetEntry = allItems[highlightedIndex];
          if (targetEntry?.item) {
            handleSelect(targetEntry.item, targetEntry.section);
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

  const handleFavouriteClick = useCallback(
    (event, sectionId, item) => {
      event.preventDefault();
      event.stopPropagation();
      if (!shouldAllowFavourite) return;
      const payload = { ...item, sectionId: sectionId ?? item.sectionId };
      const result = toggleFavourite(role, userId, payload);
      syncSections({ favouritesList: result.favourites });
    },
    [shouldAllowFavourite, role, userId, syncSections]
  );

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
            const isFavourite = Boolean(item.isFavourite);
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setHighlightedIndex(flatIndex)}
                onClick={() => handleSelect(item, section.id)}
                className={`w-full flex flex-col items-start px-4 py-3 text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-100'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="w-full flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate">{item.title}</span>
                    {item.subtitle && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block truncate">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                  {shouldAllowFavourite && item.allowFavourite && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => handleFavouriteClick(event, section.id, item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          handleFavouriteClick(event, section.id, item);
                        }
                      }}
                      className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                        isFavourite
                          ? 'text-yellow-500 hover:text-yellow-400'
                          : 'text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300'
                      }`}
                      aria-pressed={isFavourite}
                      aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                      title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                    >
                      <i className={`${isFavourite ? 'fas' : 'far'} fa-star`} aria-hidden="true"></i>
                    </span>
                  )}
                </div>
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
