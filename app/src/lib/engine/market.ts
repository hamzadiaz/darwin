/**
 * Market Data Feed — fetches real SOL/USDT OHLCV candles
 * Priority: Binance → CoinGecko (real data only, no synthetic)
 */

export interface OHLCV {
  time: number;    // unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;  // real volume (0 if unavailable from source)
}

let candleCache: { data: OHLCV[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch real SOL candles. Tries Binance first (best data),
 * falls back to CoinGecko (no volume but real prices).
 * Binance may return 451 from certain server regions (e.g. Vercel US).
 */
export async function fetchCandles(
  _symbol = 'SOLUSDT',
  interval = '4h',
  _limit = 500,
): Promise<OHLCV[]> {
  if (candleCache && Date.now() - candleCache.fetchedAt < CACHE_TTL) {
    return candleCache.data;
  }

  // Try Binance first (500 candles, real volume)
  try {
    const candles = await fetchFromBinance(interval, _limit);
    if (candles.length > 0) {
      candleCache = { data: candles, fetchedAt: Date.now() };
      return candles;
    }
  } catch (err) {
    console.warn('Binance failed, trying CoinGecko:', (err as Error).message);
  }

  // Fallback: CoinGecko OHLC (180 candles at 4h, no real volume)
  try {
    const candles = await fetchFromCoinGecko();
    if (candles.length > 0) {
      candleCache = { data: candles, fetchedAt: Date.now() };
      return candles;
    }
  } catch (err) {
    console.error('CoinGecko also failed:', (err as Error).message);
  }

  // If we have stale cache, use it (still real data)
  if (candleCache) {
    console.warn('Using stale cache');
    return candleCache.data;
  }

  throw new Error('All market data sources failed. Check your internet connection.');
}

/** Binance: best source — 500 candles with real volume */
async function fetchFromBinance(interval: string, limit: number): Promise<OHLCV[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=SOLUSDT&interval=${interval}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Binance ${res.status}`);

  const raw: (string | number)[][] = await res.json();
  return raw.map((k) => ({
    time: Math.floor(Number(k[0]) / 1000),
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
    volume: parseFloat(k[5] as string),
  }));
}

/** CoinGecko: fallback — 180 candles at 4h, real OHLC but no volume */
async function fetchFromCoinGecko(): Promise<OHLCV[]> {
  const url = 'https://api.coingecko.com/api/v3/coins/solana/ohlc?vs_currency=usd&days=30';
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Darwin/1.0' },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);

  const raw: number[][] = await res.json();
  return raw.map((c) => ({
    time: Math.floor(c[0] / 1000),
    open: c[1],
    high: c[2],
    low: c[3],
    close: c[4],
    volume: 0, // CoinGecko OHLC doesn't provide volume
  }));
}

export function clearCandleCache() {
  candleCache = null;
}
