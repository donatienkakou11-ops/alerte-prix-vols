// Get latest prices (test data for now)
app.get('/api/latest-prices', async (req, res) => {
  try {
    // Données d'exemple temporaires (en attendant de déboguer Supabase)
    const mockData = [
      { route_id: '042dba06-80e6-4960-a8fd-cfecfe5d0273', departure_city: 'Abidjan', arrival_city: 'Casablanca', airline: 'Air Maroc', cabin_class: 'ECONOMY', price: 450, currency: 'XOF', scraped_at: new Date().toISOString() },
      { route_id: 'a0123868-334f-4267-88be-1ff3631d70b3', departure_city: 'Abidjan', arrival_city: 'Paris', airline: 'Air France', cabin_class: 'ECONOMY', price: 511, currency: 'XOF', scraped_at: new Date().toISOString() },
      { route_id: 'a0123868-334f-4267-88be-1ff3631d70b3', departure_city: 'Abidjan', arrival_city: 'Paris', airline: 'Emirates', cabin_class: 'PREMIUM_ECONOMY', price: 1042, currency: 'XOF', scraped_at: new Date().toISOString() },
      { route_id: 'e2c07cee-09a3-438d-8c68-b144393cab1f', departure_city: 'Abidjan', arrival_city: 'Brussels', airline: 'Ethiopian Airlines', cabin_class: 'ECONOMY', price: 516, currency: 'XOF', scraped_at: new Date().toISOString() },
      { route_id: 'e2c07cee-09a3-438d-8c68-b144393cab1f', departure_city: 'Abidjan', arrival_city: 'Brussels', airline: 'Ethiopian Airlines', cabin_class: 'PREMIUM_ECONOMY', price: 1204, currency: 'XOF', scraped_at: new Date().toISOString() },
    ];

    res.json({
      success: true,
      data: mockData,
      count: mockData.length,
      note: 'Données d\'exemple (Supabase en déboggage)'
    });
  } catch (err) {
    console.log('❌ Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
