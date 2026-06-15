import express from 'express';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Supported tickers
const TICKERS = ['GOOG', 'TSLA', 'AMZN', 'META', 'NVDA'];

// Company metadata
const COMPANY_INFO = {
  GOOG: { name: 'Alphabet Inc.', sector: 'Technology' },
  TSLA: { name: 'Tesla, Inc.', sector: 'Automotive' },
  AMZN: { name: 'Amazon.com, Inc.', sector: 'E-Commerce' },
  META: { name: 'Meta Platforms, Inc.', sector: 'Technology' },
  NVDA: { name: 'NVIDIA Corporation', sector: 'Semiconductors' },
};

// Price cache
let stockData = {};
// Sparkline history — last 30 price snapshots per ticker
let priceHistory = {};

TICKERS.forEach((t) => {
  priceHistory[t] = [];
});

// Fetch real quotes from Yahoo Finance
async function fetchQuotes() {
  try {
    const results = await Promise.allSettled(
      TICKERS.map((symbol) => yahooFinance.quote(symbol))
    );

    const newData = {};

    results.forEach((result, index) => {
      const symbol = TICKERS[index];
      if (result.status === 'fulfilled' && result.value) {
        const q = result.value;
        newData[symbol] = {
          symbol,
          ...COMPANY_INFO[symbol],
          price: q.regularMarketPrice ?? 0,
          previousClose: q.regularMarketPreviousClose ?? 0,
          change: q.regularMarketChange ?? 0,
          changePercent: q.regularMarketChangePercent ?? 0,
          dayHigh: q.regularMarketDayHigh ?? 0,
          dayLow: q.regularMarketDayLow ?? 0,
          volume: q.regularMarketVolume ?? 0,
          marketCap: q.marketCap ?? 0,
          fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? 0,
          fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? 0,
          marketState: q.marketState ?? 'CLOSED',
        };

        // Push to sparkline history
        priceHistory[symbol].push(q.regularMarketPrice ?? 0);
        if (priceHistory[symbol].length > 30) {
          priceHistory[symbol].shift();
        }
      } else {
        // Keep previous data if fetch failed
        if (stockData[symbol]) {
          newData[symbol] = stockData[symbol];
        }
        console.error(
          `Failed to fetch ${symbol}:`,
          result.reason?.message || 'Unknown error'
        );
      }
    });

    stockData = newData;
    console.log(
      `[${new Date().toLocaleTimeString()}] Prices updated:`,
      TICKERS.map((t) => `${t}: $${stockData[t]?.price?.toFixed(2) ?? 'N/A'}`).join(', ')
    );
  } catch (error) {
    console.error('Error fetching quotes:', error.message);
  }
}

// Build the payload to send to clients
function buildPayload() {
  return JSON.stringify({
    stocks: stockData,
    sparklines: priceHistory,
    timestamp: Date.now(),
  });
}

// SSE connections
const clients = new Set();

// SSE endpoint
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send initial data immediately
  if (Object.keys(stockData).length > 0) {
    res.write(`data: ${buildPayload()}\n\n`);
  }

  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
});

// REST endpoint for one-time fetch
app.get('/api/quotes', (req, res) => {
  res.json({
    stocks: stockData,
    sparklines: priceHistory,
    timestamp: Date.now(),
  });
});

// Broadcast to all SSE clients
function broadcast() {
  const payload = buildPayload();
  clients.forEach((client) => {
    client.write(`data: ${payload}\n\n`);
  });
}

// Initial fetch + periodic polling
async function startPolling() {
  console.log('Fetching initial stock data...');
  await fetchQuotes();
  broadcast();

  // Poll every 10 seconds
  setInterval(async () => {
    await fetchQuotes();
    broadcast();
  }, 10000);
}

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  startPolling();
});
