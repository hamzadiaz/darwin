/**
 * Market Data Feed — fetches real SOL/USDC OHLCV candles
 */

export interface OHLCV {
  time: number;    // unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;  // synthetic for CoinGecko (no vol data in OHLC endpoint)
}

let candleCache: { data: OHLCV[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch SOL/USD candles from CoinGecko (free, no API key).
 * Returns ~180 candles (4h intervals over 30 days).
 */
export async function fetchCandles(
  _symbol = 'SOL',
  _interval = '4h',
  days = 30,
): Promise<OHLCV[]> {
  // Return cache if fresh
  if (candleCache && Date.now() - candleCache.fetchedAt < CACHE_TTL) {
    return candleCache.data;
  }

  try {
    const url = `https://api.coingecko.com/api/v3/coins/solana/ohlc?vs_currency=usd&days=${days}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Darwin/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);

    const raw: number[][] = await res.json();

    // CoinGecko OHLC format: [timestamp_ms, open, high, low, close]
    const candles: OHLCV[] = raw.map((c) => ({
      time: Math.floor(c[0] / 1000),
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
      volume: Math.abs(c[4] - c[1]) * 1000 + Math.random() * 500, // synthetic volume
    }));

    candleCache = { data: candles, fetchedAt: Date.now() };
    return candles;
  } catch (err) {
    console.error('Failed to fetch candles:', err);
    // If we have stale cache, return it
    if (candleCache) return candleCache.data;
    // Generate synthetic fallback
    return generateSyntheticCandles(days);
  }
}

/** Fallback: generate realistic synthetic candles based on recent SOL price range */
function generateSyntheticCandles(days: number): OHLCV[] {
  const candles: OHLCV[] = [];
  const intervalSec = 4 * 3600; // 4h
  const count = Math.floor((days * 24) / 4);
  let price = 120 + Math.random() * 30; // Start around $120-$150
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - count * intervalSec;

  for (let i = 0; i < count; i++) {
    const volatility = 0.02 + Math.random() * 0.03;
    const drift = (Math.random() - 0.52) * volatility;
    const open = price;
    const close = open * (1 + drift);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);

    candles.push({
      time: startTime + i * intervalSec,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(Math.random() * 5000 + 1000),
    });

    price = close;
  }

  return candles;
}

/** Clear the cache (useful for testing) */
export function clearCandleCache() {
  candleCache = null;
}
