import { hPaToMmHg, pickDailyForecast } from './utils.js';

const $ = (id) => document.getElementById(id);

export const els = {
  cityInput: $('cityInput'),
  getBtn: $('getWeatherBtn'),
  refreshBtn: $('refreshWeatherBtn'),
  loader: $('loader'),
  error: $('error'),
  status: $('status'),
  weather: $('weather'),
  cityName: $('cityName'),
  todayStats: $('todayStats'),
  forecastList: $('forecastList'),
  cityHistory: $('cityHistory'),
  suggestions: $('suggestions')
};

export function getCityValue() {
  return els.cityInput.value.trim();
}

export function setCityValue(value) {
  els.cityInput.value = value;
}

export function setLoading(isLoading) {
  els.loader.hidden = !isLoading;
  els.getBtn.disabled = isLoading;
  els.refreshBtn.disabled = isLoading;
  if (isLoading) els.weather.hidden = true;
}

export function showError(message, status = null) {
  els.error.textContent = status ? `${message} (код ошибки: ${status})` : message;
}

export function clearError() {
  els.error.textContent = '';
}

export function showStatus(message, type = 'info') {
  els.status.textContent = message;
  els.status.hidden = false;
  els.status.classList.remove('status-info', 'status-warning');
  els.status.classList.add(type === 'warning' ? 'status-warning' : 'status-info');
}

export function hideStatus() {
  els.status.hidden = true;
  els.status.textContent = '';
}

export function hideWeather() {
  els.weather.hidden = true;
}

export function renderCurrent(current) {
  els.cityName.textContent = `${current.name}, ${current.sys.country}`;

  const stats = [
    { label: 'Температура', value: `${Math.round(current.main.temp)}°C` },
    { label: 'Ощущается как', value: `${Math.round(current.main.feels_like)}°C` },
    { label: 'Влажность', value: `${current.main.humidity}%` },
    { label: 'Давление', value: `${hPaToMmHg(current.main.pressure)} мм рт. ст.` },
    { label: 'Ветер', value: `${current.wind.speed} м/с` }
  ];

  els.todayStats.innerHTML = stats.map((s) => `
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
    </div>
  `).join('');
}

export function renderForecast(forecast) {
  els.forecastList.innerHTML = '';

  pickDailyForecast(forecast.list).forEach((item) => {
    const card = document.createElement('div');
    card.className = 'forecast-card';

    const dateText = new Date(item.dt * 1000).toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
    const w = item.weather[0];

    card.innerHTML = `
      <div class="forecast-date">${dateText}</div>
      <img src="https://openweathermap.org/img/wn/${w.icon}@2x.png" alt="${w.description}">
      <div class="forecast-temp">${Math.round(item.main.temp)}°C</div>
      <div class="forecast-description">${w.description}</div>
    `;
    els.forecastList.appendChild(card);
  });

  els.weather.hidden = false;
}

export function renderHistory(cities, onSelect) {
  els.cityHistory.innerHTML = '';

  if (!cities.length) {
    els.cityHistory.innerHTML = '<span class="history-empty">Пока пусто</span>';
    return;
  }

  cities.forEach((city) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'history-item';
    button.textContent = city;
    button.addEventListener('click', () => onSelect(city));
    els.cityHistory.appendChild(button);
  });
}

export function renderSuggestions(cities, onSelect) {
  els.suggestions.innerHTML = '';

  if (!cities.length) {
    hideSuggestions();
    return;
  }

  cities.forEach((c) => {
    const li = document.createElement('li');
    li.className = 'suggestion-item';
    li.textContent = `${c.name}, ${c.country}`;
    li.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onSelect(c.name);
    });
    els.suggestions.appendChild(li);
  });

  els.suggestions.hidden = false;
}

export function hideSuggestions() {
  els.suggestions.hidden = true;
  els.suggestions.innerHTML = '';
}
