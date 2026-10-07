const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

// ==================== DONNÉES EN MÉMOIRE ====================
let pricesInMemory = [];

// 26 Compagnies aériennes
const airlines = [
  'Air France', 'Lufthansa', 'Ethiopian Airlines', 'Turkish Airlines', 'Emirates',
  'Air Maroc', 'Air Côte d\'Ivoire', 'Dakar Airlines', 'ASKY Airlines', 'Kenya Airways',
  'Brussels Airlines', 'KLM', 'Iberia', 'Swiss International', 'Qatar Airways',
  'Royal Air Maroc', 'Cameroon Airlines', 'Ghana Airways', 'Sénégal Airlines', 'Benin Air',
  'Alitalia', 'TAP Air Portugal', 'Air Algérie', 'Royal Jordanian', 'EgyptAir',
  'Tunisair', 'Côte d\'Ivoire Airways'
];

// 3 Routes avec UUIDs
const routes = [
  { id: '042dba06-80e6-4960-a8fd-cfecfe5d0273', departure_city: 'Abidjan', arrival_city: 'Casablanca' },
  { id: 'a0123868-334f-4267-88be-1ff3631d70b3', departure_city: 'Abidjan', arrival_city: 'Paris' },
  { id: 'e2c07cee-09a3-438d-8c68-b144393cab1f', departure_city: 'Abidjan', arrival_city: 'Brussels' }
];

// 3 Cabines avec prix
const cabins = [
  { name: 'ECONOMY', minPrice: 200, maxPrice: 800 },
  { name: 'PREMIUM_ECONOMY', minPrice: 500, maxPrice: 1500 },
  { name: 'BUSINESS', minPrice: 1500, maxPrice: 5000 }
];

// ==================== GÉNÉRER LES PRIX ====================
function generatePrices() {
  const prices = [];
  const now = new Date();

  routes.forEach(route => {
    airlines.forEach(airline => {
      cabins.forEach(cabin => {
        // Générer un prix aléatoire
        const randomPrice = Math.floor(
          Math.random() * (cabin.maxPrice - cabin.minPrice) + cabin.minPrice
        );

        prices.push({
          id: Math.random().toString(36).substring(7),
          route_id: route.id,
          departure_city: route.departure_city,
          arrival_city: route.arrival_city,
          airline: airline,
          cabin_class: cabin.name,
          price: randomPrice,
          currency: 'XOF',
          scraped_at: now.toISOString(),
          created_at: now.toISOString()
        });
      });
    });
  });

  return prices;
}

// ==================== INITIALISER LES PRIX ====================
function initializePrices() {
  pricesInMemory = generatePrices();
  console.log(`✅ Générés ${pricesInMemory.length} prix en mémoire`);
}

// ==================== ENDPOINTS API ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Flight Price Monitor API is running' });
});

// GET: Les derniers prix
app.get('/api/latest-prices', (req, res) => {
  try {
    console.log(`✅ API request: ${pricesInMemory.length} prix retournés`);
    res.json({
      success: true,
      data: pricesInMemory,
      count: pricesInMemory.length,
      source: 'Memory (Simulated Prices)',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.log('❌ API Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET: Statistiques
app.get('/api/stats', (req, res) => {
  if (pricesInMemory.length === 0) {
    return res.json({ stats: 'No prices generated yet' });
  }

  const prices = pricesInMemory.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  res.json({
    success: true,
    stats: {
      minPrice,
      maxPrice,
      avgPrice,
      totalPrices: pricesInMemory.length,
      airlines: airlines.length,
      routes: routes.length
    }
  });
});

// GET: Routes disponibles
app.get('/api/routes', (req, res) => {
  res.json({ success: true, data: routes });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    pricesGenerated: pricesInMemory.length,
    source: 'In-Memory (Simulated)'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ==================== SCHEDULER ====================
// Régénérer les prix toutes les 6 heures
cron.schedule('0 */6 * * *', () => {
  console.log('🔄 Régénération des prix...');
  initializePrices();
  console.log(`✅ ${pricesInMemory.length} prix mis à jour`);
});

// ==================== DÉMARRAGE ====================
const PORT = process.env.PORT || 3000;

// Initialiser les prix au démarrage
initializePrices();

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ ${pricesInMemory.length} prix générés en mémoire`);
  console.log(`🌍 API: http://localhost:${PORT}/api/latest-prices`);
});
