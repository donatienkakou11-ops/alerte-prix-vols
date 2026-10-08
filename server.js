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

  const key = [from.code, to.code, date, returnDate || '', cabin].join('|');
  const cached = liveCache[key];
  if (cached && Date.now() - cached.time < LIVE_CACHE_HOURS * 3600 * 1000) {
    return res.json(Object.assign({}, cached.body, { from_cache: true }));
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

  try {
    const response = await fetch('https://serpapi.com/search.json?' + params.toString());
    const json = await response.json();

    if (!response.ok || json.error) {
      console.log('❌ SerpApi :', json.error || response.status);
      // "no results" n'est pas une panne : on renvoie une liste vide
      if (String(json.error || '').toLowerCase().includes('no results')) {
        return res.json({ success: true, live: true, data: [], count: 0, trip: returnDate ? 'aller-retour' : 'aller simple' });
      }
      return res.status(502).json({ error: 'Google Flights : ' + (json.error || 'erreur ' + response.status) });
    }

    const data = parseGoogleFlights(json, from, to, cabin);
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
    res.json(body);
  } catch (err) {
    console.log('❌ SerpApi injoignable :', err.message);
    res.status(502).json({ error: 'Impossible de joindre SerpApi : ' + err.message });
  }
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});
