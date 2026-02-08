/**
 * Market Data Feed — fetches real SOL/USDT OHLCV candles from Binance (no API key needed)
 * NO synthetic/fake data. If Binance fails, we throw.
 */

export interface OHLCV {
  time: number;    // unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

let candleCache: { data: OHLCV[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch SOL/USDT candles from Binance public API.
 * Returns up to 500 candles with real OHLCV + volume.
 * Throws on failure — no fake data fallbacks.
 */
export async function fetchCandles(
  symbol = 'SOLUSDT',
  interval = '4h',
  limit = 500,
): Promise<OHLCV[]> {
  if (candleCache && Date.now() - candleCache.fetchedAt < CACHE_TTL) {
    return candleCache.data;
  }

  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) {
    throw new Error(`Binance API error: ${res.status} ${res.statusText}`);
  }

  const raw: (string | number)[][] = await res.json();

  const candles: OHLCV[] = raw.map((k) => ({
    time: Math.floor(Number(k[0]) / 1000),
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
    volume: parseFloat(k[5] as string),
  }));

  candleCache = { data: candles, fetchedAt: Date.now() };
  return candles;
}

export function clearCandleCache() {
  candleCache = null;
}
