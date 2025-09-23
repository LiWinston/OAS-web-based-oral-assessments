'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useGlobalSearchStore } from '@/store/globalSearchStore';
import { getSearchSources } from '@/search/registry';

// Ensure Course Admin sources are registered
import '@/search/sources/courseAdmin';

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
        setSections(sections);

        if (errors.length) {
          setError(`Partial data unavailable: ${errors.join(', ')}`);
          setLastFetchedKey(null);
        } else {
          setError('');
          setLastFetchedKey(contextKey);
        }

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
  }, [user, lastFetchedKey, setSections, setError, setLoading, setLastFetchedKey]);

  return children;
}

export default GlobalSearchProvider;
