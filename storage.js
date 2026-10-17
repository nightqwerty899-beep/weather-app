const KEYS = {
  history: 'weather_last_cities',
  lastCity: 'weather_last_city'
};
const HISTORY_LIMIT = 5;

export function getHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEYS.history) || '[]');
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

export function saveCity(city) {
  const name = city.trim();
  if (!name) return getHistory();

  const history = getHistory().filter((c) => c.toLowerCase() !== name.toLowerCase());
  history.unshift(name);
  const limited = history.slice(0, HISTORY_LIMIT);

  try {
    localStorage.setItem(KEYS.history, JSON.stringify(limited));
    localStorage.setItem(KEYS.lastCity, name);
  } catch {
  }
  return limited;
}

export function getLastCity() {
  try {
    return localStorage.getItem(KEYS.lastCity) || '';
  } catch {
    return '';
  }
}
