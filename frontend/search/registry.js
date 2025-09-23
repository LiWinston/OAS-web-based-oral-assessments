const registry = new Map();

/**
 * Register a set of search sources for a specific role.
 * @param {string} role - Role identifier, e.g. 'COURSE_ADMIN'.
 * @param {Array} sources - Array of source definitions.
 */
export const registerSearchSources = (role, sources) => {
  if (!role) return;
  registry.set(role, sources);
};

/**
 * Retrieve search sources registered for a role.
 * @param {string} role
 * @returns {Array}
 */
export const getSearchSources = (role) => {
  if (!role) return [];
  return registry.get(role) || [];
};

/**
 * Clear all registered sources. Primarily for testing.
 */
export const clearSearchSources = () => {
  registry.clear();
};

export default registry;
