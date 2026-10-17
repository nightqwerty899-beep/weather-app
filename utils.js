export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const countryNames = new Intl.DisplayNames(['ru'], { type: 'region' });
export function countryName(code) {
  return countryNames.of(code) || code;
}

export function mergeSuggestions(cached, fromApi) {
  const seen = new Set();
  return [...cached, ...fromApi].filter((c) => {
    const key = `${c.name.toLowerCase()}|${c.country}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function minutes(n) {
  return n * 60 * 1000;
}

export function hPaToMmHg(hPa) {
  return Math.round(hPa * 0.75006);
}

export function pickDailyForecast(list, daysCount = 5) {
  const byDay = new Map();

  list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const key = date.toISOString().slice(0, 10);
    const saved = byDay.get(key);

    if (!saved) {
      byDay.set(key, item);
      return;
    }

    const savedHour = new Date(saved.dt * 1000).getHours();
    if (Math.abs(date.getHours() - 12) < Math.abs(savedHour - 12)) {
      byDay.set(key, item);
    }
  });

  return [...byDay.values()].slice(0, daysCount);
}
