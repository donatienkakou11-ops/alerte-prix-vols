const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

// =====================================================================
// PRIX DE DEMONSTRATION
// Ces prix sont SIMULES (calcules par le serveur selon la distance),
// pas des vrais tarifs. Ils seront remplaces par une vraie source.
// =====================================================================

// Villes : n'importe laquelle peut etre un depart ou une arrivee.
// Pour ajouter une ville : une ligne ici + l'ajouter dans les compagnies.
const CITIES = [
  { city: 'Abidjan', country: "Côte d'Ivoire", code: 'ABJ', lat: 5.26, lon: -3.93 },
  { city: 'Dakar', country: 'Sénégal', code: 'DSS', lat: 14.67, lon: -17.07 },
  { city: 'Bamako', country: 'Mali', code: 'BKO', lat: 12.53, lon: -7.95 },
  { city: 'Ouagadougou', country: 'Burkina Faso', code: 'OUA', lat: 12.35, lon: -1.51 },
  { city: 'Accra', country: 'Ghana', code: 'ACC', lat: 5.6, lon: -0.17 },
  { city: 'Lomé', country: 'Togo', code: 'LFW', lat: 6.17, lon: 1.25 },
  { city: 'Cotonou', country: 'Bénin', code: 'COO', lat: 6.36, lon: 2.38 },
  { city: 'Lagos', country: 'Nigéria', code: 'LOS', lat: 6.58, lon: 3.32 },
  { city: 'Niamey', country: 'Niger', code: 'NIM', lat: 13.48, lon: 2.18 },
  { city: 'Conakry', country: 'Guinée', code: 'CKY', lat: 9.58, lon: -13.61 },
  { city: 'Monrovia', country: 'Libéria', code: 'ROB', lat: 6.23, lon: -10.36 },
  { city: 'Douala', country: 'Cameroun', code: 'DLA', lat: 4.01, lon: 9.72 },
  { city: 'Libreville', country: 'Gabon', code: 'LBV', lat: 0.46, lon: 9.41 },
  { city: 'Kinshasa', country: 'RD Congo', code: 'FIH', lat: -4.39, lon: 15.44 },
  { city: 'Addis-Abeba', country: 'Éthiopie', code: 'ADD', lat: 8.98, lon: 38.8 },
  { city: 'Nairobi', country: 'Kenya', code: 'NBO', lat: -1.32, lon: 36.93 },
  { city: 'Johannesburg', country: 'Afrique du Sud', code: 'JNB', lat: -26.13, lon: 28.24 },
  { city: 'Casablanca', country: 'Maroc', code: 'CMN', lat: 33.37, lon: -7.59 },
  { city: 'Tunis', country: 'Tunisie', code: 'TUN', lat: 36.85, lon: 10.23 },
  { city: 'Alger', country: 'Algérie', code: 'ALG', lat: 36.69, lon: 3.21 },
  { city: 'Le Caire', country: 'Égypte', code: 'CAI', lat: 30.12, lon: 31.41 },
  { city: 'Paris', country: 'France', code: 'CDG', lat: 49.01, lon: 2.55 },
  { city: 'Bruxelles', country: 'Belgique', code: 'BRU', lat: 50.9, lon: 4.48 },
  { city: 'Londres', country: 'Royaume-Uni', code: 'LHR', lat: 51.47, lon: -0.45 },
  { city: 'Manchester', country: 'Royaume-Uni', code: 'MAN', lat: 53.35, lon: -2.27 },
  { city: 'Lisbonne', country: 'Portugal', code: 'LIS', lat: 38.77, lon: -9.13 },
  { city: 'Madrid', country: 'Espagne', code: 'MAD', lat: 40.47, lon: -3.56 },
  { city: 'Rome', country: 'Italie', code: 'FCO', lat: 41.8, lon: 12.25 },
  { city: 'Francfort', country: 'Allemagne', code: 'FRA', lat: 50.03, lon: 8.57 },
  { city: 'Genève', country: 'Suisse', code: 'GVA', lat: 46.24, lon: 6.11 },
  { city: 'Istanbul', country: 'Turquie', code: 'IST', lat: 41.26, lon: 28.74 },
  { city: 'Dubaï', country: 'Émirats arabes unis', code: 'DXB', lat: 25.25, lon: 55.36 },
  { city: 'Doha', country: 'Qatar', code: 'DOH', lat: 25.27, lon: 51.61 },
  { city: 'Djeddah', country: 'Arabie saoudite', code: 'JED', lat: 21.68, lon: 39.16 },
  { city: 'Beyrouth', country: 'Liban', code: 'BEY', lat: 33.82, lon: 35.49 },
  { city: 'Guangzhou', country: 'Chine', code: 'CAN', lat: 23.39, lon: 113.3 },
  { city: 'New York', country: 'États-Unis', code: 'JFK', lat: 40.64, lon: -73.78 },
  { city: 'Montréal', country: 'Canada', code: 'YUL', lat: 45.47, lon: -73.74 }
];

const EUROPE = ['Paris', 'Bruxelles', 'Londres', 'Lisbonne', 'Madrid', 'Rome', 'Francfort', 'Genève'];

// Compagnies : hub = sa base, cities = villes qu'elle dessert (liste indicative).
// Une compagnie propose un trajet A -> B si elle dessert A et B :
// vol direct si A ou B est son hub, sinon 1 escale par son hub.
const AIRLINES = [
  { name: "Air Côte d'Ivoire", hub: 'Abidjan', cities: ['Dakar', 'Bamako', 'Ouagadougou', 'Accra', 'Lomé', 'Cotonou', 'Lagos', 'Niamey', 'Conakry', 'Monrovia', 'Douala', 'Libreville', 'Casablanca', 'Paris'] },
  { name: 'ASKY Airlines', hub: 'Lomé', cities: ['Abidjan', 'Dakar', 'Bamako', 'Ouagadougou', 'Accra', 'Cotonou', 'Lagos', 'Niamey', 'Conakry', 'Monrovia', 'Douala', 'Libreville', 'Kinshasa', 'Johannesburg'] },
  { name: 'Royal Air Maroc', hub: 'Casablanca', cities: ['Manchester', 'Abidjan', 'Dakar', 'Bamako', 'Ouagadougou', 'Accra', 'Lomé', 'Cotonou', 'Lagos', 'Niamey', 'Conakry', 'Monrovia', 'Douala', 'Libreville', 'Kinshasa', 'Tunis', 'Alger', 'Le Caire', 'Istanbul', 'Dubaï', 'Doha', 'Djeddah', 'New York', 'Montréal'].concat(EUROPE) },
  { name: 'Air France', hub: 'Paris', cities: ['Manchester', 'Abidjan', 'Dakar', 'Bamako', 'Ouagadougou', 'Accra', 'Lomé', 'Cotonou', 'Lagos', 'Niamey', 'Conakry', 'Douala', 'Libreville', 'Kinshasa', 'Nairobi', 'Johannesburg', 'Casablanca', 'Tunis', 'Alger', 'Le Caire', 'Istanbul', 'Dubaï', 'Beyrouth', 'Guangzhou', 'New York', 'Montréal'].concat(EUROPE) },
  { name: 'Brussels Airlines', hub: 'Bruxelles', cities: ['Manchester', 'Abidjan', 'Dakar', 'Ouagadougou', 'Accra', 'Lomé', 'Cotonou', 'Conakry', 'Monrovia', 'Douala', 'Kinshasa', 'Nairobi', 'New York', 'Montréal'].concat(EUROPE) },
  { name: 'Turkish Airlines', hub: 'Istanbul', cities: ['Manchester', 'Abidjan', 'Dakar', 'Bamako', 'Ouagadougou', 'Accra', 'Cotonou', 'Lagos', 'Niamey', 'Conakry', 'Douala', 'Libreville', 'Kinshasa', 'Addis-Abeba', 'Nairobi', 'Johannesburg', 'Casablanca', 'Tunis', 'Alger', 'Le Caire', 'Dubaï', 'Doha', 'Djeddah', 'Beyrouth', 'Guangzhou', 'New York', 'Montréal'].concat(EUROPE) },
  { name: 'Ethiopian Airlines', hub: 'Addis-Abeba', cities: ['Manchester', 'Abidjan', 'Dakar', 'Bamako', 'Ouagadougou', 'Accra', 'Lomé', 'Lagos', 'Niamey', 'Conakry', 'Douala', 'Libreville', 'Kinshasa', 'Nairobi', 'Johannesburg', 'Le Caire', 'Paris', 'Bruxelles', 'Londres', 'Madrid', 'Rome', 'Francfort', 'Genève', 'Istanbul', 'Dubaï', 'Djeddah', 'Beyrouth', 'Guangzhou', 'New York'] },
  { name: 'Emirates', hub: 'Dubaï', cities: ['Manchester', 'Abidjan', 'Dakar', 'Accra', 'Lagos', 'Conakry', 'Addis-Abeba', 'Nairobi', 'Johannesburg', 'Casablanca', 'Tunis', 'Alger', 'Le Caire', 'Istanbul', 'Djeddah', 'Beyrouth', 'Guangzhou', 'New York', 'Montréal'].concat(EUROPE) },
  { name: 'Qatar Airways', hub: 'Doha', cities: ['Manchester', 'Abidjan', 'Accra', 'Lagos', 'Kinshasa', 'Addis-Abeba', 'Nairobi', 'Johannesburg', 'Casablanca', 'Tunis', 'Alger', 'Le Caire', 'Istanbul', 'Dubaï', 'Djeddah', 'Beyrouth', 'Guangzhou', 'New York', 'Montréal'].concat(EUROPE) },
  { name: 'Kenya Airways', hub: 'Nairobi', cities: ['Abidjan', 'Dakar', 'Accra', 'Lagos', 'Monrovia', 'Douala', 'Kinshasa', 'Addis-Abeba', 'Johannesburg', 'Paris', 'Londres', 'Dubaï', 'Guangzhou', 'New York'] },
  { name: 'EgyptAir', hub: 'Le Caire', cities: ['Abidjan', 'Accra', 'Lagos', 'Douala', 'Kinshasa', 'Addis-Abeba', 'Nairobi', 'Johannesburg', 'Casablanca', 'Tunis', 'Alger', 'Istanbul', 'Dubaï', 'Doha', 'Djeddah', 'Beyrouth', 'Guangzhou', 'New York', 'Montréal'].concat(EUROPE) },
  { name: 'TAP Air Portugal', hub: 'Lisbonne', cities: ['Abidjan', 'Dakar', 'Accra', 'Conakry', 'Casablanca', 'Paris', 'Bruxelles', 'Londres', 'Madrid', 'Rome', 'Francfort', 'Genève', 'New York', 'Montréal'] },
  { name: 'Tunisair', hub: 'Tunis', cities: ['Abidjan', 'Dakar', 'Bamako', 'Ouagadougou', 'Niamey', 'Conakry', 'Casablanca', 'Alger', 'Le Caire', 'Istanbul', 'Djeddah', 'Beyrouth', 'Montréal'].concat(EUROPE) },
  { name: 'Air Algérie', hub: 'Alger', cities: ['Abidjan', 'Dakar', 'Bamako', 'Ouagadougou', 'Niamey', 'Douala', 'Casablanca', 'Tunis', 'Le Caire', 'Istanbul', 'Dubaï', 'Djeddah', 'Beyrouth', 'Montréal'].concat(EUROPE) },
  { name: 'Air Sénégal', hub: 'Dakar', cities: ['Abidjan', 'Bamako', 'Conakry', 'Cotonou', 'Niamey', 'Douala', 'Libreville', 'Casablanca', 'Paris'] },
  { name: 'Air Peace', hub: 'Lagos', cities: ['Abidjan', 'Dakar', 'Accra', 'Lomé', 'Cotonou', 'Niamey', 'Monrovia', 'Douala', 'Johannesburg', 'Londres', 'Dubaï', 'Djeddah'] },
  { name: 'Air Burkina', hub: 'Ouagadougou', cities: ['Abidjan', 'Dakar', 'Bamako', 'Accra', 'Lomé', 'Cotonou', 'Niamey'] },
  { name: 'Middle East Airlines', hub: 'Beyrouth', cities: ['Abidjan', 'Accra', 'Lagos', 'Le Caire', 'Istanbul', 'Dubaï', 'Doha', 'Djeddah'].concat(EUROPE) },
  { name: 'South African Airways', hub: 'Johannesburg', cities: ['Abidjan', 'Accra', 'Lagos', 'Kinshasa', 'Nairobi'] },
  { name: 'Corsair', hub: 'Paris', cities: ['Abidjan', 'Bamako', 'Cotonou'] },
  { name: 'Camair-Co', hub: 'Douala', cities: ['Abidjan', 'Cotonou', 'Lagos', 'Libreville'] },
  { name: 'Africa World Airlines', hub: 'Accra', cities: ['Abidjan', 'Lagos', 'Monrovia'] }
];

// Trajets les plus vendus par l'agence (raccourcis sur la page)
const TOP_ROUTES = [
  ['Abidjan', 'Casablanca'], ['Casablanca', 'Abidjan'],
  ['Abidjan', 'Paris'], ['Paris', 'Abidjan'],
  ['Dakar', 'Casablanca'], ['Bamako', 'Casablanca'],
  ['Abidjan', 'Manchester'], ['Manchester', 'Abidjan']
];

const CABINS = [
  { name: 'ECONOMY', label: 'Économique', factor: 1 },
  { name: 'PREMIUM_ECONOMY', label: 'Premium Économique', factor: 1.6 },
  { name: 'BUSINESS', label: 'Affaires', factor: 3.2 }
];

// "Prix tres bas" = au moins 15 % sous la moyenne du trajet (meme classe)
const LOW_PRICE_PERCENT = 15;

const cityByName = {};
CITIES.forEach((c) => { cityByName[c.city] = c; });

// Distance en km entre deux villes
function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function roundTo(value, step) {
  return Math.round(value / step) * step;
}

let offers = [];
let offersByRoute = {};
let lastUpdate = null;

function generateOffers() {
  const list = [];
  const byRoute = {};
  const now = new Date().toISOString();

  AIRLINES.forEach((airline) => {
    // Set = enleve les doublons (ex : le hub deja present dans la liste)
    const served = Array.from(new Set([airline.hub].concat(airline.cities)))
      .filter((name) => cityByName[name]);
    const hub = cityByName[airline.hub];

    for (let i = 0; i < served.length; i++) {
      for (let j = i + 1; j < served.length; j++) {
        const a = cityByName[served[i]];
        const b = cityByName[served[j]];
        const direct = a === hub || b === hub;
        const straight = distanceKm(a, b);
        const flown = direct ? straight : distanceKm(a, hub) + distanceKm(hub, b);

        // Pas de detour absurde (ex : Abidjan -> Accra en passant par Istanbul)
        if (!direct && flown > straight * 2.2 + 1500) continue;

        // Prix aller-retour economique simule : fixe + distance, moins cher avec escale
        const base = (90000 + 75 * flown) * (direct ? 1 : 0.85);
        const airlineLevel = 0.75 + Math.random() * 0.5;

        // Les deux sens du trajet
        [[a, b], [b, a]].forEach((pair) => {
          const from = pair[0];
          const to = pair[1];
          const key = from.city + '|' + to.city;

          CABINS.forEach((cabin) => {
            const noise = 0.96 + Math.random() * 0.08;
            const offer = {
              route_id: from.code + '-' + to.code,
              departure_city: from.city,
              departure_country: from.country,
              arrival_city: to.city,
              arrival_country: to.country,
              airline: airline.name,
              stops: direct ? 0 : 1,
              via: direct ? null : hub.city,
              cabin_class: cabin.name,
              cabin_label: cabin.label,
              price: roundTo(base * cabin.factor * airlineLevel * noise, 500),
              currency: 'FCFA',
              scraped_at: now
            };
            list.push(offer);
            if (!byRoute[key]) byRoute[key] = [];
            byRoute[key].push(offer);
          });
        });
      }
    }
  });

  // Meilleur prix et prix tres bas, par trajet + classe
  Object.values(byRoute).forEach((routeOffers) => {
    CABINS.forEach((cabin) => {
      const group = routeOffers.filter((o) => o.cabin_class === cabin.name);
      if (group.length === 0) return;
      const min = Math.min(...group.map((o) => o.price));
      const avg = group.reduce((sum, o) => sum + o.price, 0) / group.length;

      group.forEach((o) => {
        o.is_best_price = o.price === min;
        o.route_average = Math.round(avg);
        o.discount_percent = Math.round(((avg - o.price) / avg) * 100);
        o.is_low_price = group.length > 1 && o.discount_percent >= LOW_PRICE_PERCENT;
      });
    });
  });

  offers = list;
  offersByRoute = byRoute;
  lastUpdate = now;
  console.log('✅ ' + offers.length + ' prix de démonstration sur ' + Object.keys(byRoute).length + ' trajets');
}

// Retrouver une ville sans tenir compte des majuscules
function findCity(name) {
  const wanted = String(name || '').trim().toLowerCase();
  return CITIES.find((c) => c.city.toLowerCase() === wanted);
}

// ==================== ENDPOINTS ====================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Flight Price Monitor API is running' });
});

// Liste des villes pour les menus deroulants
app.get('/api/destinations', (req, res) => {
  const data = CITIES
    .map((c) => ({ city: c.city, country: c.country, code: c.code }))
    .sort((a, b) => a.city.localeCompare(b.city, 'fr'));
  res.json({ success: true, data: data, count: data.length });
});

app.get('/api/top-routes', (req, res) => {
  res.json({ success: true, data: TOP_ROUTES.map((r) => ({ from: r[0], to: r[1] })) });
});

// Recherche : /api/search?from=Casablanca&to=Conakry&cabin=ECONOMY
app.get('/api/search', (req, res) => {
  const from = findCity(req.query.from);
  const to = findCity(req.query.to);
  const cabin = req.query.cabin;

  if (!from || !to) {
    return res.status(400).json({ error: 'Ville de départ ou d\'arrivée inconnue' });
  }

  let results = offersByRoute[from.city + '|' + to.city] || [];
  if (cabin) {
    results = results.filter((o) => o.cabin_class === cabin);
  }
  results = results.slice().sort((a, b) => a.price - b.price);

  res.json({
    success: true,
    demo: true,
    from: from.city,
    to: to.city,
    data: results,
    count: results.length,
    updated_at: lastUpdate
  });
});

// Prix tres bas : /api/deals?from=Casablanca&cabin=ECONOMY ("from" facultatif)
app.get('/api/deals', (req, res) => {
  const cabin = req.query.cabin || 'ECONOMY';
  const from = req.query.from ? findCity(req.query.from) : null;

  const deals = offers
    .filter((o) => o.is_low_price && o.cabin_class === cabin)
    .filter((o) => !from || o.departure_city === from.city)
    .sort((a, b) => b.discount_percent - a.discount_percent)
    .slice(0, 12);

  res.json({ success: true, demo: true, data: deals, count: deals.length, updated_at: lastUpdate });
});

// =====================================================================
// VRAIS PRIX : Google Flights via SerpApi
// La cle est lue dans les reglages Render (variable SERPAPI_KEY),
// jamais ecrite dans le code ni sur GitHub.
// =====================================================================

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const EUR_TO_FCFA = 655.957; // taux fixe officiel euro / franc CFA
const LIVE_CACHE_HOURS = 6;  // une meme recherche n'est refaite qu'apres 6 h
const liveCache = {};

const SERPAPI_CLASS = { ECONOMY: 1, PREMIUM_ECONOMY: 2, BUSINESS: 3 };

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

// Transforme une reponse Google Flights en offres pour la page
function parseGoogleFlights(json, from, to, cabinName) {
  const cabin = CABINS.find((c) => c.name === cabinName) || CABINS[0];
  const all = (json.best_flights || []).concat(json.other_flights || []);
  const list = [];

  all.forEach((item) => {
    const legs = item.flights || [];
    if (!legs.length || typeof item.price !== 'number') return;

    const airlines = Array.from(new Set(legs.map((l) => l.airline).filter(Boolean)));
    const layovers = item.layovers || [];

    list.push({
      departure_city: from.city,
      arrival_city: to.city,
      airline: airlines.join(' + '),
      flight_numbers: legs.map((l) => l.flight_number).filter(Boolean).join(', '),
      departure_time: legs[0].departure_airport && legs[0].departure_airport.time,
      arrival_time: legs[legs.length - 1].arrival_airport && legs[legs.length - 1].arrival_airport.time,
      duration_minutes: item.total_duration,
      stops: legs.length - 1,
      via: layovers.map((l) => l.name || l.id).filter(Boolean).join(', ') || null,
      cabin_class: cabin.name,
      cabin_label: cabin.label,
      price: roundTo(item.price * EUR_TO_FCFA, 500),
      price_eur: item.price,
      currency: 'FCFA',
      source: 'Google Flights'
    });
  });

  list.sort((a, b) => a.price - b.price);

  if (list.length) {
    const min = list[0].price;
    const avg = list.reduce((sum, o) => sum + o.price, 0) / list.length;
    list.forEach((o) => {
      o.is_best_price = o.price === min;
      o.route_average = Math.round(avg);
      o.discount_percent = Math.round(((avg - o.price) / avg) * 100);
      o.is_low_price = list.length > 1 && o.discount_percent >= LOW_PRICE_PERCENT;
    });
  }
  return list;
}

// Vrais prix : /api/live-search?from=Abidjan&to=Paris&date=2026-11-15&return=2026-11-30&cabin=ECONOMY
// Chaque nouvelle recherche consomme 1 recherche SerpApi (250 gratuites par mois).
// Recherche Google Flights (utilisee par la page et par la surveillance).
// Renvoie { data, google_flights_url, ... } ou leve une erreur.
async function searchGoogleFlights(from, to, date, returnDate, cabin) {
  const key = [from.code, to.code, date, returnDate || '', cabin].join('|');
  const cached = liveCache[key];
  if (cached && Date.now() - cached.time < LIVE_CACHE_HOURS * 3600 * 1000) {
    return Object.assign({}, cached.body, { from_cache: true });
  }

  const params = new URLSearchParams({
    engine: 'google_flights',
    departure_id: from.code,
    arrival_id: to.code,
    outbound_date: date,
    type: returnDate ? '1' : '2', // 1 = aller-retour, 2 = aller simple
    travel_class: String(SERPAPI_CLASS[cabin]),
    currency: 'EUR',
    hl: 'fr',
    api_key: SERPAPI_KEY
  });
  if (returnDate) params.set('return_date', returnDate);

  const response = await fetch('https://serpapi.com/search.json?' + params.toString());
  const json = await response.json();
  let data = [];

  if (!response.ok || json.error) {
    // "no results" n'est pas une panne : simplement aucun vol
    if (!/no results|any results/i.test(String(json.error || ''))) {
      throw new Error('Google Flights : ' + (json.error || 'erreur ' + response.status));
    }
  } else {
    data = parseGoogleFlights(json, from, to, cabin);
  }

  const body = {
    success: true,
    live: true,
    from: from.city,
    to: to.city,
    date: date,
    return_date: returnDate || null,
    trip: returnDate ? 'aller-retour' : 'aller simple',
    data: data,
    count: data.length,
    google_flights_url: json.search_metadata && json.search_metadata.google_flights_url,
    searched_at: new Date().toISOString()
  };
  liveCache[key] = { time: Date.now(), body: body };
  console.log('✅ Google Flights ' + from.code + '-' + to.code + ' ' + date + ' : ' + data.length + ' vols');
  return body;
}

// Vrais prix : /api/live-search?from=Abidjan&to=Paris&date=2026-11-15&return=2026-11-30&cabin=ECONOMY
// Chaque nouvelle recherche consomme 1 recherche SerpApi (250 gratuites par mois).
app.get('/api/live-search', async (req, res) => {
  if (!SERPAPI_KEY) {
    return res.status(503).json({ error: 'Clé SerpApi absente : ajoutez SERPAPI_KEY dans Render > Environment' });
  }

  const from = findCity(req.query.from);
  const to = findCity(req.query.to);
  const date = req.query.date;
  const returnDate = req.query.return;
  const cabin = SERPAPI_CLASS[req.query.cabin] ? req.query.cabin : 'ECONOMY';

  if (!from || !to) return res.status(400).json({ error: 'Ville de départ ou d\'arrivée inconnue' });
  if (!isDate(date)) return res.status(400).json({ error: 'Date de départ manquante (format AAAA-MM-JJ)' });
  if (returnDate && (!isDate(returnDate) || returnDate < date)) {
    return res.status(400).json({ error: 'Date de retour invalide' });
  }

  try {
    res.json(await searchGoogleFlights(from, to, date, returnDate, cabin));
  } catch (err) {
    console.log('❌ SerpApi :', err.message);
    res.status(502).json({ error: err.message });
  }
});

// =====================================================================
// SURVEILLANCE AUTOMATIQUE des trajets les plus vendus
// - un trajet est verifie tous les 2 jours (8 trajets = ~120 recherches / mois)
// - date de vol surveillee : depart dans 21 jours, aller simple, economique
// - alerte si le meilleur prix baisse d'au moins 10 % depuis la verification precedente
// - l'historique est garde dans Supabase (projet "Alerte Prix Vols")
// =====================================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const WATCH_EVERY_HOURS = 48;
const WATCH_DAYS_AHEAD = 21;
const ALERT_DROP_PERCENT = 10;

// Petit client pour l'API REST de Supabase
async function db(path, options) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase non configuré (SUPABASE_URL / SUPABASE_SERVICE_KEY)');
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, Object.assign({}, options, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }
  }));
  const text = await response.text();
  if (!response.ok) throw new Error('Supabase ' + response.status + ' : ' + text);
  return text ? JSON.parse(text) : null;
}

function routeFilter(from, to) {
  return 'route_from=eq.' + encodeURIComponent(from) + '&route_to=eq.' + encodeURIComponent(to);
}

// Les 2 dernieres verifications d'un trajet
async function lastChecks(from, to) {
  return db('price_checks?select=*&' + routeFilter(from, to) + '&order=checked_at.desc&limit=2');
}

// ==================== MESSAGE WHATSAPP (CallMeBot, gratuit) ====================
// Reglages Render : CALLMEBOT_PHONE (ex : 2250700000000, sans +) et CALLMEBOT_APIKEY.
// Sans ces reglages, les alertes restent seulement sur la page.
const CALLMEBOT_PHONE = process.env.CALLMEBOT_PHONE;
const CALLMEBOT_APIKEY = process.env.CALLMEBOT_APIKEY;

async function sendWhatsApp(text) {
  if (!CALLMEBOT_PHONE || !CALLMEBOT_APIKEY) return false;
  const url = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(CALLMEBOT_PHONE) +
    '&text=' + encodeURIComponent(text) + '&apikey=' + encodeURIComponent(CALLMEBOT_APIKEY);
  try {
    const response = await fetch(url);
    const body = await response.text();
    const ok = response.ok && !/error|invalid/i.test(body.slice(0, 300));
    if (!ok) console.log('❌ WhatsApp :', response.status, body.slice(0, 200));
    return ok;
  } catch (err) {
    console.log('❌ WhatsApp injoignable :', err.message);
    return false;
  }
}

function fcfa(n) {
  return Number(n).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' FCFA';
}

function alertText(a) {
  const route = a.route_from + ' → ' + a.route_to;
  const date = a.travel_date.split('-').reverse().join('/');
  if (a.kind === 'ouverture') return '🟢 VOL OUVERT ' + route + ' : ' + a.airline + ' apparaît (vol du ' + date + '), à partir de ' + fcfa(a.new_price);
  if (a.kind === 'fermeture') return '🔴 VOL FERMÉ ' + route + ' : ' + a.airline + ' n\'est plus proposée (vol du ' + date + '). À vérifier sur Amadeus.';
  return '📉 PRIX EN BAISSE ' + route + ' : -' + a.drop_percent + ' % · ' + fcfa(a.old_price) + ' → ' + fcfa(a.new_price) + ' (' + a.airline + ', vol du ' + date + ')';
}

// Compagnies presentes dans les resultats (un vol "A + B" compte pour A et pour B)
function airlinesOf(offers) {
  const set = new Set();
  offers.forEach((o) => String(o.airline || '').split(' + ').forEach((n) => { if (n) set.add(n); }));
  return Array.from(set).sort();
}

function cheapestFor(offers, airline) {
  const found = offers.filter((o) => String(o.airline).split(' + ').includes(airline));
  return found.length ? found[0].price : null;
}

async function checkRoute(fromName, toName) {
  const from = findCity(fromName);
  const to = findCity(toName);
  const travelDate = new Date(Date.now() + WATCH_DAYS_AHEAD * 86400000).toISOString().slice(0, 10);

  const history = await lastChecks(from.city, to.city);
  const prev1 = history[0]; // verification precedente
  const prev2 = history[1]; // celle d'avant
  const result = await searchGoogleFlights(from, to, travelDate, null, 'ECONOMY');
  const offers = result.data; // deja tries du moins cher au plus cher
  const best = offers[0];
  const airlines = airlinesOf(offers);

  await db('price_checks', {
    method: 'POST',
    body: JSON.stringify({
      route_from: from.city,
      route_to: to.city,
      travel_date: travelDate,
      cabin: 'ECONOMY',
      min_price: best ? best.price : null,
      min_airline: best ? best.airline : null,
      offers_count: offers.length,
      airlines: airlines
    })
  });

  const base = { route_from: from.city, route_to: to.city, travel_date: travelDate };
  const alerts = [];

  // 📉 Baisse de prix
  if (best && prev1 && prev1.min_price) {
    const drop = Math.round(((prev1.min_price - best.price) / prev1.min_price) * 100);
    if (drop >= ALERT_DROP_PERCENT) {
      alerts.push(Object.assign({ kind: 'baisse', airline: best.airline, old_price: prev1.min_price, new_price: best.price, drop_percent: drop }, base));
    }
  }

  // On ne compare les compagnies que si les recherches ont bien trouve des vols
  // (une recherche vide = probleme passager, pas une fermeture generale).
  const prev1Ok = prev1 && Array.isArray(prev1.airlines) && prev1.offers_count > 0;
  const prev2Ok = prev2 && Array.isArray(prev2.airlines) && prev2.offers_count > 0;

  if (offers.length > 0 && prev1Ok) {
    // 🟢 Ouverture : presente maintenant, absente la fois precedente
    airlines.filter((n) => !prev1.airlines.includes(n)).forEach((n) => {
      alerts.push(Object.assign({ kind: 'ouverture', airline: n, new_price: cheapestFor(offers, n) }, base));
    });
    // 🔴 Fermeture : presente il y a 2 verifications, absente les 2 dernieres fois
    if (prev2Ok) {
      prev2.airlines.filter((n) => !prev1.airlines.includes(n) && !airlines.includes(n)).forEach((n) => {
        alerts.push(Object.assign({ kind: 'fermeture', airline: n }, base));
      });
    }
  }

  for (const a of alerts) {
    a.whatsapp_sent = await sendWhatsApp(alertText(a));
    await db('price_alerts', { method: 'POST', body: JSON.stringify(a) });
    console.log('🔔 ' + alertText(a));
  }
  return best;
}

let watchRunning = false;

// Verifie UN trajet : celui dont la derniere verification est la plus ancienne,
// seulement s'il n'a pas ete verifie depuis 48 h (sinon ne fait rien et ne coute rien).
async function runWatchCycle() {
  if (!SERPAPI_KEY || !SUPABASE_URL || !SUPABASE_KEY || watchRunning) return { checked: null };
  watchRunning = true;
  try {
    let oldest = null;
    for (const r of TOP_ROUTES) {
      const last = (await lastChecks(r[0], r[1]))[0];
      const time = last ? new Date(last.checked_at).getTime() : 0;
      if (!oldest || time < oldest.time) oldest = { route: r, time: time };
    }
    // Marge de 6 h pour que le cycle de 6 h ne "rate" pas l'echeance
    if (!oldest || Date.now() - oldest.time < (WATCH_EVERY_HOURS - 6) * 3600 * 1000) {
      return { checked: null, message: 'Rien à vérifier pour le moment' };
    }
    const best = await checkRoute(oldest.route[0], oldest.route[1]);
    return { checked: oldest.route[0] + ' → ' + oldest.route[1], best_price: best ? best.price : null };
  } finally {
    watchRunning = false;
  }
}

// A appeler toutes les 6 h par un service externe (cron-job.org) :
// cela reveille le serveur Render gratuit et lance la verification.
app.get('/api/watch/run', async (req, res) => {
  try {
    res.json(Object.assign({ success: true }, await runWatchCycle()));
  } catch (err) {
    console.log('❌ Surveillance :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Test du message WhatsApp : ouvrir /api/whatsapp/test dans le navigateur
app.get('/api/whatsapp/test', async (req, res) => {
  if (!CALLMEBOT_PHONE || !CALLMEBOT_APIKEY) {
    return res.status(503).json({ error: 'Ajoutez CALLMEBOT_PHONE et CALLMEBOT_APIKEY dans Render > Environment' });
  }
  const ok = await sendWhatsApp('✅ Alerte Prix Vols : les messages WhatsApp fonctionnent.');
  res.json({ success: ok });
});

// Etat des trajets surveilles, pour la page
app.get('/api/watch', async (req, res) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.json({ enabled: false, data: [] });
  try {
    const data = [];
    for (const r of TOP_ROUTES) {
      const checks = await lastChecks(r[0], r[1]);
      const last = checks[0];
      const prev = checks[1];
      data.push({
        from: r[0],
        to: r[1],
        min_price: last ? last.min_price : null,
        airline: last ? last.min_airline : null,
        travel_date: last ? last.travel_date : null,
        checked_at: last ? last.checked_at : null,
        previous_price: prev ? prev.min_price : null,
        change_percent: last && prev && last.min_price && prev.min_price
          ? Math.round(((last.min_price - prev.min_price) / prev.min_price) * 100) : null
      });
    }
    const alerts = await db('price_alerts?select=*&order=created_at.desc&limit=10');
    res.json({ enabled: true, data: data, alerts: alerts });
  } catch (err) {
    console.log('❌ Surveillance :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Plusieurs jours : /api/live-range?from=Abidjan&to=Paris&start=2026-11-10&end=2026-11-20&cabin=ECONOMY
// 1 recherche par jour (11 jours = 11 recherches), sauf les jours deja cherches dans les 6 h.
const RANGE_MAX_DAYS = 14;

function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

app.get('/api/live-range', async (req, res) => {
  if (!SERPAPI_KEY) {
    return res.status(503).json({ error: 'Clé SerpApi absente : ajoutez SERPAPI_KEY dans Render > Environment' });
  }
  const from = findCity(req.query.from);
  const to = findCity(req.query.to);
  const start = req.query.start;
  const end = req.query.end;
  const cabin = SERPAPI_CLASS[req.query.cabin] ? req.query.cabin : 'ECONOMY';
  const today = new Date().toISOString().slice(0, 10);

  if (!from || !to) return res.status(400).json({ error: 'Ville de départ ou d\'arrivée inconnue' });
  if (!isDate(start) || !isDate(end) || end < start) return res.status(400).json({ error: 'Dates du / au invalides' });
  if (start < today) return res.status(400).json({ error: 'La première date est déjà passée' });

  const dates = [];
  for (let d = start; d <= end; d = addDays(d, 1)) dates.push(d);
  if (dates.length > RANGE_MAX_DAYS) {
    return res.status(400).json({ error: 'Maximum ' + RANGE_MAX_DAYS + ' jours par comparaison (ici ' + dates.length + ')' });
  }

  // 3 recherches en meme temps pour aller plus vite
  const days = new Array(dates.length);
  const byAirline = {};
  let next = 0;
  async function worker() {
    while (next < dates.length) {
      const i = next++;
      const date = dates[i];
      try {
        const r = await searchGoogleFlights(from, to, date, null, cabin);
        const best = r.data[0];
        // Meilleur prix de chaque compagnie ce jour-la
        r.data.forEach((o) => {
          String(o.airline || '').split(' + ').forEach((name) => {
            if (!name) return;
            const cur = byAirline[name];
            if (!cur || o.price < cur.price) {
              byAirline[name] = { airline: name, price: o.price, date: date, stops: o.stops, departure_time: o.departure_time, days_available: cur ? cur.days_available : 0 };
            }
          });
        });
        airlinesOf(r.data).forEach((name) => { byAirline[name].days_available = (byAirline[name].days_available || 0) + 1; });
        days[i] = {
          date: date,
          count: r.data.length,
          airlines: airlinesOf(r.data),
          best: best ? { price: best.price, airline: best.airline, stops: best.stops, departure_time: best.departure_time } : null,
          from_cache: !!r.from_cache
        };
      } catch (err) {
        days[i] = { date: date, error: err.message };
      }
    }
  }
  await Promise.all([worker(), worker(), worker()]);

  const priced = days.filter((d) => d.best);
  const min = priced.length ? Math.min(...priced.map((d) => d.best.price)) : null;
  days.forEach((d) => { d.is_best_day = !!(d.best && d.best.price === min); });

  res.json({
    success: true,
    from: from.city,
    to: to.city,
    cabin: cabin,
    trip: 'aller simple',
    days: days,
    // Classement des compagnies : leur meilleur prix sur toute la periode
    airlines: Object.values(byAirline).sort((a, b) => a.price - b.price),
    best_price: min,
    searches_used: days.filter((d) => !d.error && !d.from_cache).length
  });
});

// Recherches restantes ce mois-ci (cette verification ne consomme pas de recherche)
app.get('/api/live-status', async (req, res) => {
  if (!SERPAPI_KEY) return res.json({ enabled: false });
  try {
    const response = await fetch('https://serpapi.com/account.json?api_key=' + encodeURIComponent(SERPAPI_KEY));
    const json = await response.json();
    res.json({
      enabled: true,
      searches_left: json.total_searches_left !== undefined ? json.total_searches_left : json.plan_searches_left,
      searches_per_month: json.searches_per_month
    });
  } catch (err) {
    res.json({ enabled: true, searches_left: null });
  }
});

// Ancien endpoint, limite a 300 lignes (il y a maintenant des milliers de prix)
app.get('/api/latest-prices', (req, res) => {
  const data = offers.slice(0, 300);
  res.json({ success: true, demo: true, data: data, count: data.length, total: offers.length, updated_at: lastUpdate });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!', offers: offers.length, demo: true });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ==================== DEMARRAGE ====================

generateOffers();

// Nouveaux prix toutes les 6 heures
cron.schedule('0 */6 * * *', generateOffers);

// Surveillance : essai toutes les 6 h (+ au demarrage), si le serveur est reveille
cron.schedule('30 */6 * * *', () => { runWatchCycle().catch((e) => console.log('❌ Surveillance :', e.message)); });
setTimeout(() => { runWatchCycle().catch((e) => console.log('❌ Surveillance :', e.message)); }, 10000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});
