import { minutes, countryName } from './utils.js';

export const TimeToLive = 5 * 60 * 1000;
const MAX = 5;
const cache = new Map();

export function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.time > TimeToLive) {
    cache.delete(key);
    return null;
  }
  return entry;
}

export function cacheSearch(query) {
  const q = query.trim().toLowerCase();
  const result = [];

  for (const [key, entry] of cache) {
    if (Date.now() - entry.time > TimeToLive) continue;
    const name = entry.current.name;
    if (key.startsWith(q) || name.toLowerCase().startsWith(q)) {
      result.push({ name, country: countryName(entry.current.sys.country) });
    }
  }
  return result.reverse();
}

export function cacheSet(key, data) {
  cache.delete(key);
  const entry = { ...data, time: Date.now() };
  cache.set(key, entry);

  if (cache.size > MAX) {
    cache.delete(cache.keys().next().value);
  }
  return entry;
}
