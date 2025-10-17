'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useGlobalSearchStore } from '@/store/globalSearchStore';
import { getSearchSources } from '@/search/registry';
import { getFavourites, getFavouritesSet, getRecents, pruneFavourites, pruneRecents } from '@/search/persistence';

const TTL_MS = 60 * 1000; // soft refresh every 60s when palette is opened

const buildContextKey = (user) => {
  const role = user?.role ?? 'unknown-role';
  const id = user?.id ?? 'anonymous';
  return `${role}-${id}`;
};

export function GlobalSearchProvider({ children }) {
  const user = useAuthStore((state) => state.user);
  const setSections = useGlobalSearchStore((state) => state.setSections);
  const setLoading = useGlobalSearchStore((state) => state.setLoading);
  const setError = useGlobalSearchStore((state) => state.setError);
  const lastFetchedKey = useGlobalSearchStore((state) => state.lastFetchedKey);
  const setLastFetchedKey = useGlobalSearchStore((state) => state.setLastFetchedKey);
  const lastFetchedAt = useGlobalSearchStore((state) => state.lastFetchedAt);
  const setLastFetchedAt = useGlobalSearchStore((state) => state.setLastFetchedAt);
  const isOpen = useGlobalSearchStore((state) => state.isOpen);

  useEffect(() => {
    setSections([]);
    setError('');
  }, [setSections, setError]);

  useEffect(() => {
    const role = user?.role;

    if (!role) {
      setSections([]);
      setLastFetchedKey(null);
      return;
    }

    const sources = getSearchSources(role);
    const contextKey = buildContextKey(user);

    if (!sources.length) {
      setSections([]);
      setLastFetchedKey(contextKey);
      return;
    }

    if (lastFetchedKey === contextKey) {
      return;
    }

    let cancelled = false;
    const context = {
      user,
      role,
      cache: {},
    };

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const results = await Promise.allSettled(
          sources.map(async (source) => {
            const items = await source.loader(context);
            return {
              id: source.id,
              label: source.label,
              items: Array.isArray(items) ? items : [],
              priority: source.priority ?? 0,
              defaultLimit: source.defaultLimit ?? 5,
              queryLimit: source.queryLimit ?? source.defaultLimit ?? 10,
              alwaysVisible: source.alwaysVisible ?? false,
            };
          })
        );

        if (cancelled) return;

        const sections = [];
        const errors = [];

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            sections.push(result.value);
          } else {
            const source = sources[index];
            errors.push(source?.label || source?.id || 'Unknown source');
          }
        });

        sections.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

        // Reconcile favourites/recents against current catalog to remove stale items
        try {
          const catalogIds = new Set();
          sections.forEach((s) => {
            if (s?.id?.endsWith('.favourites') || s?.id?.endsWith('.recents')) return;
            (s.items || []).forEach((it) => it?.id && catalogIds.add(it.id));
          });
          if (catalogIds.size > 0) {
            const role = user?.role;
            const userId = user?.id ?? user?.userId ?? user?.adminId ?? user?.examinerId ?? user?.studentId;
            pruneFavourites(role, userId, catalogIds);
            pruneRecents(role, userId, catalogIds);

            // Rebuild favourites/recents sections from pruned storage for this render
            const favIdx = sections.findIndex((s) => s?.id?.endsWith('.favourites'));
            if (favIdx >= 0) {
              const favs = getFavourites(role, userId);
              sections[favIdx] = {
                ...sections[favIdx],
                items: favs.map((it) => ({ ...it, allowFavourite: true, isFavourite: true })),
              };
            }
            const recIdx = sections.findIndex((s) => s?.id?.endsWith('.recents'));
            if (recIdx >= 0) {
              const recs = getRecents(role, userId);
              const favSet = getFavouritesSet(role, userId);
              sections[recIdx] = {
                ...sections[recIdx],
                items: recs.map((it) => ({ ...it, allowFavourite: true, isFavourite: favSet.has(it.id) })),
              };
            }
          }
        } catch (_e) {
          // ignore reconciliation errors silently
        }
        setSections(sections);

        if (errors.length) {
          // Show friendly message in UI; log details to console in dev
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[GlobalSearch] partial load errors:', errors);
          }
          setError('Some sections could not be loaded.');
          setLastFetchedKey(null);
        } else {
          setError('');
          setLastFetchedKey(contextKey);
        }

        setLastFetchedAt(Date.now());

        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        setSections([]);
        setError(error?.message || 'Failed to load global search data.');
        setLoading(false);
        setLastFetchedKey(null);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user, lastFetchedKey, setSections, setError, setLoading, setLastFetchedKey, setLastFetchedAt]);

  // When palette is opened, refresh if TTL expired or key mismatch
  useEffect(() => {
    if (!isOpen) return;
    const role = user?.role;
    if (!role) return;
    const contextKey = buildContextKey(user);
    const expired = !lastFetchedAt || Date.now() - lastFetchedAt > TTL_MS;
    if (expired || lastFetchedKey !== contextKey) {
      setLastFetchedKey(null);
    }
  }, [isOpen, user, lastFetchedAt, lastFetchedKey, setLastFetchedKey]);

  // Global invalidation hook: other parts can trigger a refresh
  useEffect(() => {
    const handler = () => setLastFetchedKey(null);
    if (typeof window !== 'undefined') {
      window.addEventListener('oas-search-invalidate', handler);
      // expose a helper for imperative invalidation
      if (!window.oasInvalidateGlobalSearch) {
        window.oasInvalidateGlobalSearch = () => {
          window.dispatchEvent(new Event('oas-search-invalidate'));
        };
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('oas-search-invalidate', handler);
      }
    };
  }, [setLastFetchedKey]);

  return children;
}

export default GlobalSearchProvider;
