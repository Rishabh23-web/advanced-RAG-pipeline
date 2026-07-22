/**
 * Query Router
 * In a full system, this uses tool calling to decide whether to query the auth-db or vector-store.
 * Since our primary goal is course content, we route directly to vector-store.
 */
export async function routeQuery(query) {
  // Hardcoded to return vector-store for this specific implementation
  // as we removed the postgres auth-db requirement.
  return 'vector-store';
}
