const FORECAST = "https://api.open-meteo.com/v1/forecast";
const GEO = "https://geocoding-api.open-meteo.com/v1/search";

const cities = [
  { name: "Shanghai", lat: 31.2304, lon: 121.4737 },
  { name: "Jhapa", lat: 26.6464, lon: 87.8989 },
  { name: "Kathmandu", lat: 27.7172, lon: 85.324 },
  { name: "Everest", lat: 27.9881, lon: 86.925 },
];

function timeOnly(iso) {
  return iso.split("T")[1];
} // "...T05:12" -> "05:12"
// Turn Open-Meteo's weathercode into emoji + text
function describeWeather(code) {
  const map = {
    0: ["☀️", "Clear sky"],
    1: ["🌤️", "Mainly clear"],
    2: ["⛅", "Partly cloudy"],
    3: ["☁️", "Overcast"],
    45: ["🌫️", "Foggy"],
    48: ["🌫️", "Rime fog"],
    51: ["🌦️", "Light drizzle"],
    53: ["🌦️", "Drizzle"],
    55: ["🌧️", "Heavy drizzle"],
    61: ["🌦️", "Light rain"],
    63: ["🌧️", "Rain"],
    65: ["🌧️", "Heavy rain"],
    71: ["🌨️", "Light snow"],
    73: ["❄️", "Snow"],
    75: ["❄️", "Heavy snow"],
    80: ["🌦️", "Rain showers"],
    81: ["🌧️", "Showers"],
    82: ["⛈️", "Violent showers"],
    95: ["⛈️", "Thunderstorm"],
    96: ["⛈️", "Thunderstorm + hail"],
    99: ["⛈️", "Severe thunderstorm"],
  };
  return map[code] || ["🌡️", "Unknown"];
}

async function getWeather(lat, lon) {
  const url =
    `${FORECAST}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,cloud_cover,wind_speed_10m,wind_direction_10m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function cityToCoords(name) {
  const res = await fetch(`${GEO}?name=${encodeURIComponent(name)}&count=1`);
  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;
  const r = data.results[0];
  return { name: r.name, lat: r.latitude, lon: r.longitude };
}

// ----- Fill the three cards -----
function updateCards(cityName, data) {
  const c = data.current,
    d = data.daily;
  document.getElementById("cityHeading").textContent =
    `Weather for ${cityName}`;

  document.getElementById("bigTemp").textContent = Math.round(c.temperature_2m);
  document.getElementById("temp").textContent = c.temperature_2m;
  document.getElementById("minTemp").textContent = d.temperature_2m_min[0];
  document.getElementById("maxTemp").textContent = d.temperature_2m_max[0];

  document.getElementById("bigHumidity").textContent = c.relative_humidity_2m;
  document.getElementById("windDeg").textContent = c.wind_direction_10m;
  document.getElementById("feelsLike").textContent = c.apparent_temperature;
  document.getElementById("humidity").textContent = c.relative_humidity_2m;

  document.getElementById("bigWind").textContent = c.wind_speed_10m;
  document.getElementById("windSpeed").textContent = c.wind_speed_10m;
  document.getElementById("sunrise").textContent = timeOnly(d.sunrise[0]);
  document.getElementById("sunset").textContent = timeOnly(d.sunset[0]);
  const [icon, text] = describeWeather(c.weather_code);
  document.getElementById("condIcon").textContent = icon;
  document.getElementById("condText").textContent = text;
}

async function showCity(cityName, lat, lon) {
  try {
    updateCards(cityName, await getWeather(lat, lon));
  } catch (err) {
    console.error(`Failed for ${cityName}:`, err);
  }
}

// ----- Search box -----
document.getElementById("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // stop page reload
  const name = document.getElementById("searchInput").value.trim();
  if (!name) return;
  const place = await cityToCoords(name);
  if (!place) {
    alert(`Could not find "${name}"`);
    return;
  }
  showCity(place.name, place.lat, place.lon);
});

// ----- Table of common places -----
const tableBody = document.getElementById("weatherRows");

function makeRow(city, data) {
  const c = data.current,
    d = data.daily;
  return `
    <tr>
      <th scope="row" class="text-start">${city.name}</th>
      <td>${c.cloud_cover}%</td>
      <td>${c.apparent_temperature}&deg;C</td>
      <td>${d.temperature_2m_max[0]}&deg;C</td>
      <td>${d.temperature_2m_min[0]}&deg;C</td>
      <td>${timeOnly(d.sunrise[0])}</td>
      <td>${timeOnly(d.sunset[0])}</td>
      <td>${c.temperature_2m}&deg;C</td>
      <td>${c.wind_direction_10m}&deg;</td>
      <td>${c.wind_speed_10m} km/h</td>
    </tr>`;
}
async function loadAllCities() {
  tableBody.innerHTML = "";
  for (const city of cities) {
    try {
      tableBody.innerHTML += makeRow(
        city,
        await getWeather(city.lat, city.lon),
      );
    } catch (err) {
      console.error(`Failed for ${city.name}:`, err);
      tableBody.innerHTML += `<tr><th class="text-start">${city.name}</th><td colspan="10">Error</td></tr>`;
    }
  }
}

// ----- Start -----
showCity("Kathmandu", 27.7172, 85.324); // default cards on load
loadAllCities();
document.querySelectorAll(".dropdown-city").forEach((item) => {
  item.addEventListener("click", async (e) => {
    e.preventDefault();
    const name = e.target.dataset.city;
    const place = await cityToCoords(name);
    if (place) showCity(place.name, place.lat, place.lon);
  });
}); // fill the table
