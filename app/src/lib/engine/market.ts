/**
 * Market Data Feed — fetches real SOL/USDT OHLCV from Binance API
 * NO synthetic/fake data. Real data or error.
 */

export interface OHLCV {
  time: number;    // unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;  // real volume from Binance
}

let candleCache: { data: OHLCV[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch real SOL/USDT candles from Binance API.
 * No API key required. Returns up to 500 candles.
 * 500 x 4h = ~83 days of data.
 */
export async function fetchCandles(
  _symbol = 'SOL',
  interval = '4h',
  _days = 30,
): Promise<OHLCV[]> {
  // Return cache if fresh
  if (candleCache && Date.now() - candleCache.fetchedAt < CACHE_TTL) {
    return candleCache.data;
  }

  const url = `https://api.binance.com/api/v3/klines?symbol=SOLUSDT&interval=${interval}&limit=500`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Binance API error: ${res.status} ${res.statusText}`);
    }

    const raw: (string | number)[][] = await res.json();

    // Binance kline format:
    // [openTime, open, high, low, close, volume, closeTime, quoteAssetVolume, numberOfTrades, ...]
    const candles: OHLCV[] = raw.map((k) => ({
      time: Math.floor(Number(k[0]) / 1000), // openTime ms → seconds
      open: parseFloat(k[1] as string),
      high: parseFloat(k[2] as string),
      low: parseFloat(k[3] as string),
      close: parseFloat(k[4] as string),
      volume: parseFloat(k[5] as string),     // real base asset volume
    }));

    candleCache = { data: candles, fetchedAt: Date.now() };
    return candles;
  } catch (err) {
    clearTimeout(timeout);
    console.error('Failed to fetch candles from Binance:', err);

    // Return stale cache if available (still real data, just old)
    if (candleCache) {
      console.warn('Using stale cache (real data, just old)');
      return candleCache.data;
    }

    // No fake data — throw error
    throw new Error(
      'Failed to fetch market data from Binance. Check your internet connection and try again.'
    );
  }
}

/** Clear the cache (useful for testing) */
export function clearCandleCache() {
  candleCache = null;
}
