/* =========================================================
   DataDash — logique applicative
   API météo : Open-Meteo (gratuite, sans clé requise)
   - Géocodage : geocoding-api.open-meteo.com
   - Prévisions : api.open-meteo.com
   ========================================================= */

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const HISTORY_KEY = "datadash_history";
const MAX_HISTORY = 5;

// ----- Éléments du DOM -----
const el = {
  form: document.getElementById("searchForm"),
  input: document.getElementById("cityInput"),
  geoBtn: document.getElementById("geoBtn"),
  errorMsg: document.getElementById("errorMsg"),
  cityName: document.getElementById("cityName"),
  updatedAt: document.getElementById("updatedAt"),
  weatherIcon: document.getElementById("weatherIcon"),
  temp: document.getElementById("temp"),
  description: document.getElementById("description"),
  feelsLike: document.getElementById("feelsLike"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  historyList: document.getElementById("historyList"),
  historyEmpty: document.getElementById("historyEmpty"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  forecastTrack: document.getElementById("forecastTrack"),
  currentDate: document.getElementById("currentDate"),
};

// ----- Table de correspondance des codes météo (norme WMO) -----
// Chaque entrée fournit une description en français et une icône SVG.
const WEATHER_CODES = {
  0: { label: "Ciel dégagé", icon: "sun" },
  1: { label: "Plutôt dégagé", icon: "sun" },
  2: { label: "Partiellement nuageux", icon: "cloud-sun" },
  3: { label: "Couvert", icon: "cloud" },
  45: { label: "Brouillard", icon: "fog" },
  48: { label: "Brouillard givrant", icon: "fog" },
  51: { label: "Bruine légère", icon: "drizzle" },
  53: { label: "Bruine", icon: "drizzle" },
  55: { label: "Bruine dense", icon: "drizzle" },
  61: { label: "Pluie légère", icon: "rain" },
  63: { label: "Pluie", icon: "rain" },
  65: { label: "Pluie forte", icon: "rain" },
  66: { label: "Pluie verglaçante", icon: "rain" },
  67: { label: "Pluie verglaçante forte", icon: "rain" },
  71: { label: "Neige légère", icon: "snow" },
  73: { label: "Neige", icon: "snow" },
  75: { label: "Neige forte", icon: "snow" },
  77: { label: "Grains de neige", icon: "snow" },
  80: { label: "Averses légères", icon: "drizzle" },
  81: { label: "Averses", icon: "rain" },
  82: { label: "Averses violentes", icon: "rain" },
  85: { label: "Averses de neige", icon: "snow" },
  86: { label: "Averses de neige fortes", icon: "snow" },
  95: { label: "Orage", icon: "storm" },
  96: { label: "Orage avec grêle", icon: "storm" },
  99: { label: "Orage violent avec grêle", icon: "storm" },
};

const ICONS = {
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8" stroke-linecap="round"/></svg>`,
  "cloud-sun": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="3.2"/><path d="M8 2.5V4M8 12v1.5M2.5 8H4M12 8h1.5M3.8 3.8l1 1M12.2 3.8l-1 1" stroke-linecap="round"/><path d="M6 19h11a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.6A3.6 3.6 0 0 0 6 19Z"/></svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 18h11a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.6A3.6 3.6 0 0 0 6 18Z"/></svg>`,
  fog: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 8h9M3 12h14M5 16h9M17 12h4M15 16h4"/></svg>`,
  drizzle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 14h11a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.6A3.6 3.6 0 0 0 6 14Z"/><path d="M9 18v2M13 18v2" stroke-linecap="round"/></svg>`,
  rain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 13h11a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.6A3.6 3.6 0 0 0 6 13Z"/><path d="M8 17l-1.5 3M13 17l-1.5 3M18 17l-1.5 3" stroke-linecap="round"/></svg>`,
  snow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 12h11a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.6A3.6 3.6 0 0 0 6 12Z"/><path d="M9 16v5M6.5 18.5l5 -2.5 5 2.5M9 16l-1-1M9 21l-1-1M9 16l1-1M9 21l1-1" stroke-linecap="round"/></svg>`,
  storm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 12h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.6A3.6 3.6 0 0 0 6 12Z"/><path d="M13 14l-3 4h3l-2 4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

// ----- Utilitaires -----

// Arrondit une température (ex: 22.45 -> 22)
function roundTemp(value) {
  return Math.round(value);
}

// Convertit un timestamp UNIX (secondes) en heure lisible "18:00"
function unixToTime(unixSeconds, timezone) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone || undefined,
  });
}

function weekdayLabel(dateStr, index) {
  if (index === 0) return "Aujourd'hui";
  const d = new Date(dateStr + "T12:00:00");
  const label = d.toLocaleDateString("fr-FR", { weekday: "short" });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

function showError(msg) {
  el.errorMsg.textContent = msg;
}
function clearError() {
  el.errorMsg.textContent = "";
}

// ----- Historique des villes recherchées (localStorage) -----

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveToHistory(place) {
  let history = getHistory();
  // Retire les doublons (même ville) avant de la remettre en tête
  history = history.filter(
    (h) => !(h.name === place.name && h.country === place.country),
  );
  history.unshift(place);
  history = history.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  el.historyList.innerHTML = "";

  if (history.length === 0) {
    el.historyEmpty.style.display = "flex";
    return;
  }
  el.historyEmpty.style.display = "none";

  history.forEach((place, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "history-item";
    btn.innerHTML = `
      <span class="history-rank">${String(i + 1).padStart(2, "0")}</span>
      <span>
        <span class="history-city">${place.name}</span>
        <span class="history-region">${place.region || place.country || ""}</span>
      </span>
      <span class="history-arrow">›</span>
    `;
    btn.addEventListener("click", () => loadWeatherForPlace(place));
    li.appendChild(btn);
    el.historyList.appendChild(li);
  });
}

// ----- Appels API -----

async function geocodeCity(cityName) {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(cityName)}&count=1&language=fr&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de géocodage");
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("Ville introuvable. Essayez un autre nom.");
  }
  const r = data.results[0];
  return {
    name: r.name,
    region: r.admin1 || "",
    country: r.country_code,
    lat: r.latitude,
    lon: r.longitude,
  };
}

async function fetchWeather(lat, lon) {
  const url =
    `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&forecast_days=6&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur lors de la récupération de la météo");
  return res.json();
}

// ----- Rendu -----

function renderCurrent(place, data) {
  const code = data.current.weather_code;
  const info = WEATHER_CODES[code] || {
    label: "Conditions variables",
    icon: "cloud",
  };

  el.cityName.innerHTML = `📍 ${place.name} <small style="color:var(--text-faint)">${(place.country || "").toUpperCase()}</small>`;
  el.updatedAt.textContent = `Mis à jour à ${unixToTime(Math.floor(Date.now() / 1000), data.timezone)}`;
  el.weatherIcon.innerHTML = ICONS[info.icon];
  el.temp.textContent = roundTemp(data.current.temperature_2m);
  el.description.textContent = info.label;
  el.feelsLike.textContent = `${roundTemp(data.current.apparent_temperature)}°`;
  el.humidity.textContent = `${Math.round(data.current.relative_humidity_2m)}%`;
  el.wind.textContent = `${Math.round(data.current.wind_speed_10m)} km/h`;
}

function renderForecast(data) {
  el.forecastTrack.innerHTML = "";
  const days = data.daily.time;

  days.forEach((dateStr, i) => {
    const code = data.daily.weather_code[i];
    const info = WEATHER_CODES[code] || {
      label: "Conditions variables",
      icon: "cloud",
    };
    const max = roundTemp(data.daily.temperature_2m_max[i]);
    const min = roundTemp(data.daily.temperature_2m_min[i]);
    const rain = data.daily.precipitation_probability_max[i];

    const card = document.createElement("div");
    card.className = "forecast-card" + (i === 0 ? " is-today" : "");
    card.innerHTML = `
      <span class="forecast-day">${weekdayLabel(dateStr, i)}</span>
      ${i === 0 ? '<span class="forecast-badge">Point de départ</span>' : ""}
      <div class="forecast-icon">${ICONS[info.icon]}</div>
      <p class="forecast-desc">${info.label}</p>
      <div class="forecast-temps">${max}° <span class="low">${min}°</span></div>
      <div class="forecast-rain">
        <span>Pluie</span><span>${rain}%</span>
      </div>
      <div class="rain-bar"><div class="rain-bar-fill" style="width:${rain}%"></div></div>
    `;
    el.forecastTrack.appendChild(card);
  });
}

// ----- Orchestration -----

async function loadWeatherForPlace(place) {
  clearError();
  el.description.textContent = "Chargement…";
  try {
    const data = await fetchWeather(place.lat, place.lon);
    renderCurrent(place, data);
    renderForecast(data);
    saveToHistory(place);
    localStorage.setItem("datadash_last", JSON.stringify(place));
  } catch (err) {
    showError(err.message || "Une erreur est survenue.");
  }
}

async function loadWeatherForCityName(cityName) {
  clearError();
  try {
    const place = await geocodeCity(cityName);
    await loadWeatherForPlace(place);
  } catch (err) {
    showError(err.message || "Une erreur est survenue.");
  }
}

function loadWeatherForCoords(lat, lon) {
  clearError();
  const place = { name: "Ma position", region: "", country: "", lat, lon };
  loadWeatherForPlace(place);
}

// ----- Événements -----

el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = el.input.value.trim();
  if (!value) return;
  loadWeatherForCityName(value);
  el.input.value = "";
});

el.geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError("La géolocalisation n'est pas disponible sur cet appareil.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => loadWeatherForCoords(pos.coords.latitude, pos.coords.longitude),
    () => showError("Impossible d'accéder à votre position."),
  );
});

el.clearHistoryBtn.addEventListener("click", clearHistory);

// ----- Initialisation -----

function init() {
  el.currentDate.textContent = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  renderHistory();

  const last = JSON.parse(localStorage.getItem("datadash_last") || "null");
  if (last) {
    loadWeatherForPlace(last);
  } else {
    loadWeatherForCityName("Paris");
  }
}

init();
