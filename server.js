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

// Get latest prices from Supabase
app.get('/api/latest-prices', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('prices')
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      data: data || [],
      count: (data || []).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
