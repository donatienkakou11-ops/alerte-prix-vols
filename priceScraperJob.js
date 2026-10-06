const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
const { sendWhatsAppAlert, detectAlerts, detectFlightClosure, detectFlightOpening, getCurrentPrices, getPreviousPrices } = require('./alertService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const airlines = ["Air France", "Lufthansa", "Ethiopian Airlines", "Turkish Airlines", "Emirates", "Air Maroc", "Air Côte d'Ivoire", "Dakar Airlines", "ASKY Airlines", "Kenya Airways", "Brussels Airlines", "KLM", "Iberia", "Swiss International", "Qatar Airways", "Royal Air Maroc", "Cameroon Airlines", "Ghana Airways", "Sénégal Airlines", "Benin Air", "Alitalia", "TAP Air Portugal", "Alitalia Express", "Air Algérie", "Royal Jordanian", "EgyptAir"];
const cabinClasses = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS'];

function getRandomPrice(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function scrapePrices() {
  console.log('🔄 Starting price scraping job...');

  try {
    const routes = [
      { id: '042dba06-80e6-4960-a8fd-cfecfe5d0273', departure_city: 'Abidjan', arrival_city: 'Casablanca' },
      { id: 'a0123868-334f-4267-88be-1ff3631d70b3', departure_city: 'Abidjan', arrival_city: 'Paris' },
      { id: 'e2c07cee-09a3-438d-8c68-b144393cab1f', departure_city: 'Abidjan', arrival_city: 'Brussels' }
    ];

    for (const route of routes) {
      const previousPrices = await getPreviousPrices(route.id);
      const currentPrices = [];

      for (const cabin of cabinClasses) {
        const priceRanges = {
          'ECONOMY': { min: 200, max: 800 },
          'PREMIUM_ECONOMY': { min: 500, max: 1500 },
          'BUSINESS': { min: 1500, max: 5000 }
        };

        const range = priceRanges[cabin];
        const price = getRandomPrice(range.min, range.max);
        const airline = airlines[Math.floor(Math.random() * airlines.length)];

        currentPrices.push(airline + '_' + cabin);

        const { error } = await supabase.from('prices').insert({
          route_id: route.id,
          airline: airline,
          price: price,
          cabin_class: cabin,
          currency: 'XOF',
          scraped_at: new Date()
        });

        if (error) {
          console.log('❌ Insert error:', error.message);
        } else {
          console.log('✅ Saved price: ' + route.departure_city + ' → ' + route.arrival_city + ' (' + cabin + ') = ' + price + ' XOF (' + airline + ')');

          const alerts = await detectAlerts(route, price, cabin, airline);
          for (const alert of alerts) {
            console.log('');
            console.log(alert.message);
            console.log('');
          }
        }
      }

      if (previousPrices) {
        const closedAlerts = await detectFlightClosure(route, currentPrices.sort(), previousPrices);
        const openedAlerts = await detectFlightOpening(route, currentPrices.sort(), previousPrices);

        for (const alert of [...closedAlerts, ...openedAlerts]) {
          console.log('');
          console.log(alert.message);
          console.log('');
        }
      }
    }

    console.log('✅ Scraping job completed!');
  } catch (error) {
    console.error('❌ Scraping error:', error.message);
  }
}

function startPriceScraper() {
  console.log('⏱️ Price scraper job scheduled (every 6 hours)');
  cron.schedule('0 */6 * * *', () => {
    scrapePrices();
  });

  scrapePrices();
}

module.exports = { startPriceScraper };
