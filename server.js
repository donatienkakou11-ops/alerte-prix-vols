const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { startPriceScraper } = require('./priceScraperJob');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const app = express();

app.use(cors());
app.use(express.json());

// Start the price scraper
startPriceScraper();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Flight Price Monitor API is running' });
});

// API endpoints (placeholder for future use)
app.get('/api/routes', (req, res) => {
  res.json({ message: 'Routes endpoint' });
});

app.get('/api/prices/:route_id', (req, res) => {
  res.json({ message: 'Prices endpoint' });
});

app.get('/api/alerts', (req, res) => {
  res.json({ message: 'Alerts endpoint' });
});

// Get latest prices (test data for now)
app.get('/api/latest-prices', (req, res) => {
  const now = new Date().toISOString();

  const mockData = [
    { route_id: '042dba06-80e6-4960-a8fd-cfecfe5d0273', departure_city: 'Abidjan', arrival_city: 'Casablanca', airline: 'Air Maroc', cabin_class: 'ECONOMY', price: 450, currency: 'XOF', scraped_at: now },
    { route_id: 'a0123868-334f-4267-88be-1ff3631d70b3', departure_city: 'Abidjan', arrival_city: 'Paris', airline: 'Air France', cabin_class: 'ECONOMY', price: 511, currency: 'XOF', scraped_at: now },
    { route_id: 'a0123868-334f-4267-88be-1ff3631d70b3', departure_city: 'Abidjan', arrival_city: 'Paris', airline: 'Emirates', cabin_class: 'PREMIUM_ECONOMY', price: 1042, currency: 'XOF', scraped_at: now },
    { route_id: 'e2c07cee-09a3-438d-8c68-b144393cab1f', departure_city: 'Abidjan', arrival_city: 'Brussels', airline: 'Ethiopian Airlines', cabin_class: 'ECONOMY', price: 516, currency: 'XOF', scraped_at: now },
    { route_id: 'e2c07cee-09a3-438d-8c68-b144393cab1f', departure_city: 'Abidjan', arrival_city: 'Brussels', airline: 'Ethiopian Airlines', cabin_class: 'PREMIUM_ECONOMY', price: 1204, currency: 'XOF', scraped_at: now },
  ];

  res.json({
    success: true,
    data: mockData,
    count: mockData.length,
    note: 'Test data (Supabase debugging)'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    supabaseURL: process.env.SUPABASE_URL ? 'Set ✅' : 'Not set ❌'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Supabase: ${process.env.SUPABASE_URL}`);
});
