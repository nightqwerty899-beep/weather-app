import { countryName } from './utils.js';

const API_KEY ='5f35dad7f1317b64efdbae245bb45c30';
const BASE = 'https://api.openweathermap.org';

export const ERROR_KIND = {
  NETWORK: 'network',
  NOT_FOUND: 'not_found',
  OTHER: 'other'
};

export class ApiError extends Error {
  constructor(kind, message, status = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

function messageForStatus(status, city) {
  if (status === 404) return `Город «${city}» не найден`;
  if (status === 401 || status === 403) return 'Проблема с ключом API';
  if (status === 429) return 'Слишком много запросов. Подождите минуту и повторите';
  if (status >= 500) return 'Сервер недоступен, попробуйте позже';
  return 'Не удалось получить данные';
}

async function request(url, { city = '', signal } = {}) {
  let response;
  try {
    response = await fetch(url, { signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(ERROR_KIND.NETWORK, 'Нет соединения с интернетом');
  }

  if (!response.ok) {
    const kind = response.status === 404 ? ERROR_KIND.NOT_FOUND : ERROR_KIND.OTHER;
    throw new ApiError(kind, messageForStatus(response.status, city), response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError(ERROR_KIND.OTHER, 'Сервер вернул некорректный ответ', response.status);
  }
}

function params(extra) {
  return new URLSearchParams({ appid: API_KEY, units: 'metric', lang: 'ru', ...extra });
}

export function getWeather(city) {
  return request(`${BASE}/data/2.5/weather?${params({ q: city })}`, { city });
}

export function getForecast(city) {
  return request(`${BASE}/data/2.5/forecast?${params({ q: city, cnt: 40 })}`, { city });
}

export async function getCitySuggestions(query, signal) {
  const url = `${BASE}/geo/1.0/direct?${params({ q: query, limit: 5 })}`;
  const data = await request(url, { city: query, signal });
  return data.map((c) => ({
    name: c.local_names?.ru || c.name,
    country: countryName(c.country)
  }));
}
