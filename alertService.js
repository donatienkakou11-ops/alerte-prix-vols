const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Simuler l'envoi WhatsApp
async function sendWhatsAppAlert(phoneNumber, message) {
  console.log('📱 WhatsApp Alert:');
  console.log('   To: ' + phoneNumber);
  console.log('   Message: ' + message);
  console.log('');
}

// Récupérer les prix actuels d'une route
async function getCurrentPrices(routeId) {
  const { data, error } = await supabase
    .from('prices')
    .select('airline, cabin_class, price')
    .eq('route_id', routeId)
    .order('scraped_at', { ascending: false })
    .limit(3);

  if (error) return null;
  return data ? data.map(p => p.airline + '_' + p.cabin_class).sort() : [];
}

// Récupérer les prix du scrape précédent
async function getPreviousPrices(routeId) {
  const { data, error } = await supabase
    .from('prices')
    .select('airline, cabin_class, price')
    .eq('route_id', routeId)
    .order('scraped_at', { ascending: false })
    .limit(6);

  if (error || !data || data.length < 3) return null;

  return data.slice(3, 6).map(p => p.airline + '_' + p.cabin_class).sort();
}

// Détecter vols fermés
async function detectFlightClosure(route, currentPrices, previousPrices) {
  if (!previousPrices) return [];

  const alerts = [];
  const closed = previousPrices.filter(p => !currentPrices.includes(p));

  for (const flightKey of closed) {
    const [airline, cabin] = flightKey.split('_');
    alerts.push({
      type: 'FLIGHT_CLOSED',
      message: '🔴 VOL FERMÉ!\\n' +
        route.departure_city + ' → ' + route.arrival_city + '\\n' +
        airline + ' (' + cabin + ')'
    });
  }
  return alerts;
}

// Détecter vols ouverts
async function detectFlightOpening(route, currentPrices, previousPrices) {
  if (!previousPrices) return [];

  const alerts = [];
  const opened = currentPrices.filter(p => !previousPrices.includes(p));

  for (const flightKey of opened) {
    const [airline, cabin] = flightKey.split('_');

    const { data } = await supabase
      .from('prices')
      .select('price')
      .eq('route_id', route.id)
      .eq('airline', airline)
      .eq('cabin_class', cabin)
      .order('scraped_at', { ascending: false })
      .limit(1);

    const price = data && data.length > 0 ? data[0].price : 'N/A';

    alerts.push({
      type: 'FLIGHT_OPENED',
      message: '🟢 VOL OUVERT!\\n' +
        route.departure_city + ' → ' + route.arrival_city + '\\n' +
        airline + ' (' + cabin + ')\\n' +
        '💰 ' + price + ' XOF'
    });
  }
  return alerts;
}

// Détection meilleur prix
async function getMinPrice(routeId, cabinClass) {
  const { data, error } = await supabase
    .from('prices')
    .select('price')
    .eq('route_id', routeId)
    .eq('cabin_class', cabinClass)
    .order('price', { ascending: true })
    .limit(1);

  if (error) return null;
  return data && data.length > 0 ? data[0].price : null;
}

// Détection baisse prix
async function getPreviousPrice(routeId, cabinClass) {
  const { data, error } = await supabase
    .from('prices')
    .select('price')
    .eq('route_id', routeId)
    .eq('cabin_class', cabinClass)
    .order('scraped_at', { ascending: false })
    .limit(2);

  if (error || !data || data.length < 2) return null;
  return data[1].price;
}

// Détecter les alertes
async function detectAlerts(route, currentPrice, cabinClass, airline) {
  const alerts = [];

  const minPrice = await getMinPrice(route.id, cabinClass);
  if (minPrice && currentPrice === minPrice) {
    alerts.push({
      type: 'BEST_PRICE',
      message: '🎯 MEILLEUR PRIX TROUVÉ!\\n' +
        route.departure_city + ' → ' + route.arrival_city + '\\n' +
        airline + ' - ' + cabinClass + '\\n' +
        '💰 ' + currentPrice + ' XOF'
    });
  }

  const previousPrice = await getPreviousPrice(route.id, cabinClass);
  if (previousPrice && currentPrice < previousPrice) {
    const priceDropPercent = Math.round(((previousPrice - currentPrice) / previousPrice) * 100);
    if (priceDropPercent > 10) {
      alerts.push({
        type: 'PRICE_DROP',
        message: '📉 PRIX EN BAISSE DE ' + priceDropPercent + '%!\\n' +
          route.departure_city + ' → ' + route.arrival_city + '\\n' +
          airline + ' - ' + cabinClass + '\\n' +
          'Avant: ' + previousPrice + ' XOF → Maintenant: ' + currentPrice + ' XOF'
      });
    }
  }

  return alerts;
}

module.exports = { sendWhatsAppAlert, detectAlerts, detectFlightClosure, detectFlightOpening, getCurrentPrices, getPreviousPrices };
