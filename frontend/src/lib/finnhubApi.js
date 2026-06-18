/**
 * Finnhub API client — free tier, called directly from the browser.
 *
 * Get your free API key at: https://finnhub.io/register
 * Free tier: 60 API calls / minute — more than enough for 5 tickers.
 *
 * The key is safe to embed for free-tier personal projects.
 * For production apps, proxy through a serverless function.
 */

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'demo';
const BASE = 'https://finnhub.io/api/v1';

const COMPANY_INFO = {
  GOOG: { name: 'Alphabet Inc.',        sector: 'Technology' },
  TSLA: { name: 'Tesla, Inc.',           sector: 'Automotive' },
  AMZN: { name: 'Amazon.com, Inc.',      sector: 'E-Commerce' },
  META: { name: 'Meta Platforms, Inc.',   sector: 'Technology' },
  NVDA: { name: 'NVIDIA Corporation',    sector: 'Semiconductors' },
};

/**
 * Fetch a real-time quote for one symbol.
 * Finnhub /quote returns: { c, d, dp, h, l, o, pc, t }
 *   c  = current price
 *   d  = change
 *   dp = percent change
 *   h  = high of the day
 *   l  = low of the day
 *   o  = open price of the day
 *   pc = previous close price
 *   t  = timestamp
 */
async function fetchQuote(symbol) {
  const res = await fetch(`${BASE}/quote?symbol=${symbol}&token=${API_KEY}`);
  if (!res.ok) throw new Error(`Finnhub quote error ${res.status}`);
  return res.json();
}

/**
 * Fetch basic financials (for market cap, 52-week high/low).
 * Finnhub /stock/metric returns a `metric` object with many fields.
 */
async function fetchMetrics(symbol) {
  const res = await fetch(
    `${BASE}/stock/metric?symbol=${symbol}&metric=all&token=${API_KEY}`
  );
  if (!res.ok) throw new Error(`Finnhub metric error ${res.status}`);
  return res.json();
}

/**
 * Fetch all supported tickers in parallel and return the same data shape
 * the Dashboard/StockCard already expects.
 */
export async function fetchAllStocks(tickers) {
  const results = await Promise.allSettled(
    tickers.map(async (symbol) => {
      const [quote, metrics] = await Promise.all([
        fetchQuote(symbol),
        fetchMetrics(symbol),
      ]);
      return { symbol, quote, metrics };
    })
  );

  const stocks = {};

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { symbol, quote, metrics } = result.value;
      const m = metrics?.metric || {};
      const info = COMPANY_INFO[symbol] || { name: symbol, sector: '' };

      // Determine market state based on timestamp / market hours
      const now = new Date();
      const nyHour = Number(
        now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false })
      );
      const day = now.toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'short' });
      const isWeekday = !['Sat', 'Sun'].includes(day);
      let marketState = 'CLOSED';
      if (isWeekday) {
        if (nyHour >= 9 && nyHour < 16) marketState = 'REGULAR';
        else if (nyHour >= 4 && nyHour < 9) marketState = 'PRE';
        else if (nyHour >= 16 && nyHour < 20) marketState = 'POST';
      }

      stocks[symbol] = {
        symbol,
        name: info.name,
        sector: info.sector,
        price: quote.c ?? 0,
        previousClose: quote.pc ?? 0,
        change: quote.d ?? 0,
        changePercent: quote.dp ?? 0,
        dayHigh: quote.h ?? 0,
        dayLow: quote.l ?? 0,
        open: quote.o ?? 0,
        volume: 0,                          // Finnhub free doesn't include volume in /quote
        marketCap: (m.marketCapitalization ?? 0) * 1e6, // metric is in millions
        fiftyTwoWeekHigh: m['52WeekHigh'] ?? 0,
        fiftyTwoWeekLow: m['52WeekLow'] ?? 0,
        marketState,
      };
    }
  });

  return stocks;
}

export { COMPANY_INFO };
