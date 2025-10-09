const isBrowser = typeof window !== 'undefined';

const sanitizeItem = (item) => {
  if (!item) return null;
  const safeItem = {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle ?? '',
    href: item.href ?? '',
    keywords: item.keywords ?? '',
  };

  if (!safeItem.id || !safeItem.href || !safeItem.title) {
    return null;
  }

  if (item.sectionId) {
    safeItem.sectionId = item.sectionId;
  }

  return safeItem;
};

const storageKey = (type, role, userId = 'anonymous') => {
  const rolePart = role || 'unknown';
  return `oas-search-${type}:${rolePart}:${userId}`;
};

const readList = (key) => {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.warn('Global search persistence read failed', error);
    return [];
  }
};

const writeList = (key, list) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch (error) {
    console.warn('Global search persistence write failed', error);
  }
};

const upsertItem = (items, item, limit, { timestampField = 'updatedAt', timestampValue } = {}) => {
  if (!item) return items;
  const next = items.filter((existing) => existing.id !== item.id);
  const record = {
    ...item,
    [timestampField]: timestampValue ?? Date.now(),
  };
  next.unshift(record);
  return next.slice(0, limit);
};

const RECENTS_LIMIT = 15;
const FAVOURITES_LIMIT = 50;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const getRecents = (role, userId) => {
  const key = storageKey('recents', role, userId);
  const now = Date.now();
  const list = readList(key)
    .filter((item) => !item.updatedAt || now - item.updatedAt <= ONE_DAY_MS); // TTL: 1 day
  return list
    .filter((item) => item && item.id && item.href && item.title)
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
};

export const addRecent = (role, userId, item) => {
  const safeItem = sanitizeItem(item);
  if (!safeItem) return [];
  const key = storageKey('recents', role, userId);
  const current = readList(key);
  const next = upsertItem(current, safeItem, RECENTS_LIMIT, { timestampField: 'updatedAt' });
  writeList(key, next);
  return next;
};

export const clearRecents = (role, userId) => {
  const key = storageKey('recents', role, userId);
  writeList(key, []);
  return [];
};

export const getFavourites = (role, userId) => {
  const key = storageKey('favourites', role, userId);
  const now = Date.now();
  const list = readList(key)
    .filter((item) => !item.favouritedAt || now - item.favouritedAt <= ONE_DAY_MS); // TTL: 1 day
  return list
    .filter((item) => item && item.id && item.href && item.title)
    .sort((a, b) => (b.favouritedAt ?? 0) - (a.favouritedAt ?? 0));
};

export const isFavourite = (role, userId, itemId) => {
  if (!itemId) return false;
  const favourites = getFavourites(role, userId);
  return favourites.some((item) => item.id === itemId);
};

export const setFavourite = (role, userId, item, shouldFavourite) => {
  const key = storageKey('favourites', role, userId);
  const current = readList(key);

  if (!shouldFavourite) {
    const filtered = current.filter((existing) => existing.id !== item.id);
    writeList(key, filtered);
    return filtered;
  }

  const safeItem = sanitizeItem(item);
  if (!safeItem) {
    writeList(key, current);
    return current;
  }

  const next = upsertItem(current, safeItem, FAVOURITES_LIMIT, {
    timestampField: 'favouritedAt',
  });
  writeList(key, next);
  return next;
};

export const toggleFavourite = (role, userId, item, explicitState) => {
  const currentState = explicitState ?? !isFavourite(role, userId, item?.id);
  const list = setFavourite(role, userId, item, currentState);
  return {
    isFavourite: currentState,
    favourites: list,
  };
};

export const getFavouritesSet = (role, userId) => {
  const favourites = getFavourites(role, userId);
  return new Set(favourites.map((item) => item.id));
};

// Purge helpers for removing stale entries that no longer exist in current catalog
const pruneListByIds = (list, validIdsSet) => {
  if (!Array.isArray(list) || !validIdsSet) return list || [];
  return list.filter((item) => item?.id && validIdsSet.has(item.id));
};

export const pruneRecents = (role, userId, validIdsSet) => {
  const key = storageKey('recents', role, userId);
  const current = readList(key);
  const pruned = pruneListByIds(current, validIdsSet);
  writeList(key, pruned);
  return pruned;
};

export const pruneFavourites = (role, userId, validIdsSet) => {
  const key = storageKey('favourites', role, userId);
  const current = readList(key);
  const pruned = pruneListByIds(current, validIdsSet);
  writeList(key, pruned);
  return pruned;
};

