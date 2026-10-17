import { getWeather, getForecast, getCitySuggestions, ApiError, ERROR_KIND } from './api.js';
import { cacheGet, cacheSet, cacheSearch, TimeToLive } from './cache.js';
import { getHistory, saveCity, getLastCity } from './storage.js';
import { debounce, mergeSuggestions } from './utils.js';
import * as ui from './ui.js';

const MIN_CHARS = 2;       
const SUGGEST_DELAY = 400;

let changeTimer = null;
let suggestController = null;
let isLoading = false;

async function loadWeather(city, { force = false } = {}) {
  if (isLoading) return;

  if (!city) {
    ui.showError('Введите название города');
    ui.hideWeather();
    ui.hideStatus();
    return;
  }

  ui.hideSuggestions();
  ui.clearError();
  ui.hideStatus();
  isLoading = true;
  ui.setLoading(true);

  try {
    const key = city.toLowerCase();
    let entry = force ? null : cacheGet(key);
    const fromCache = entry !== null;

    if (!fromCache) {
      const [current, forecast] = await Promise.all([getWeather(city), getForecast(city)]);
      entry = cacheSet(key, { current, forecast });
    }

    ui.renderCurrent(entry.current);
    ui.renderForecast(entry.forecast);
    ui.setCityValue(city);
    ui.renderHistory(saveCity(city), selectCity);

    if (fromCache) ui.showStatus('Данные из кеша (не старше 5 минут)');
    scheduleStaleNotice(entry.time);
  } catch (err) {
    handleError(err, city);
  } finally {
    isLoading = false;
    ui.setLoading(false);
  }
}

function handleError(err, city) {
  ui.hideWeather();

  if (err instanceof ApiError) {
    switch (err.kind) {
      case ERROR_KIND.NETWORK:
        ui.showError('Нет соединения. Проверьте интернет и нажмите «Обновить»');
        break;
      case ERROR_KIND.NOT_FOUND:
        ui.showError(`Ничего не найдено по запросу «${city}». Проверьте название`, err.status);
        break;
      default:
        ui.showError(`Что-то пошло не так: ${err.message}`, err.status);
    }
    return;
  }

  ui.showError(`Что-то пошло не так: ${err.message}`);
}

function scheduleStaleNotice(time) {
  clearTimeout(changeTimer);
  const delay = Math.max(0, TimeToLive - (Date.now() - time));
  changeTimer = setTimeout(() => {
    ui.showStatus('Погода изменилась. Нажмите «Обновить» для актуализации.', 'warning');
  }, delay);
}

function selectCity(city) {
  ui.setCityValue(city);
  loadWeather(city);
}

async function onCityInput() {
  const query = ui.getCityValue();

  suggestController?.abort()

  if (query.length < MIN_CHARS) {
    ui.hideSuggestions();
    return;
  }

  const cached = cacheSearch(query);
  ui.renderSuggestions(cached, selectCity);

  suggestController = new AbortController();
  try {
    const fromApi = await getCitySuggestions(query, suggestController.signal);
    ui.renderSuggestions(mergeSuggestions(cached, fromApi), selectCity);
  } catch (err) {
    if (err.name === 'AbortError') return;
  }
}

const onCityInputDebounced = debounce(onCityInput, SUGGEST_DELAY);


ui.els.getBtn.addEventListener('click', () => loadWeather(ui.getCityValue() || getLastCity()));

ui.els.refreshBtn.addEventListener('click', () => {
  const city = ui.getCityValue() || getLastCity();
  if (!city) {
    ui.showError('Сначала выберите или найдите город');
    return;
  }
  loadWeather(city, { force: true });
});

ui.els.cityInput.addEventListener('input', onCityInputDebounced);
ui.els.cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadWeather(ui.getCityValue() || getLastCity());
});
ui.els.cityInput.addEventListener('blur', () => ui.hideSuggestions());

ui.renderHistory(getHistory(), selectCity);
const lastCity = getLastCity();
if (lastCity) ui.setCityValue(lastCity);