/**
 * Market Data Feed — fetches real OHLCV candles for SOL, BTC, ETH
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

export type TradingPair = 'SOLUSDT' | 'BTCUSDT' | 'ETHUSDT';

export const SUPPORTED_PAIRS: { symbol: TradingPair; label: string; coingeckoId: string }[] = [
  { symbol: 'SOLUSDT', label: 'SOL/USDT', coingeckoId: 'solana' },
  { symbol: 'BTCUSDT', label: 'BTC/USDT', coingeckoId: 'bitcoin' },
  { symbol: 'ETHUSDT', label: 'ETH/USDT', coingeckoId: 'ethereum' },
];

// Per-symbol cache
const candleCaches: Map<string, { data: OHLCV[]; fetchedAt: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getPairLabel(symbol: TradingPair): string {
  return SUPPORTED_PAIRS.find(p => p.symbol === symbol)?.label ?? symbol;
}

/**
 * Fetch real candles for any supported pair.
 * Tries Binance first, falls back to CoinGecko.
 */
export async function fetchCandles(
  symbol: TradingPair = 'SOLUSDT',
  interval = '4h',
  limit = 500,
): Promise<OHLCV[]> {
  const cacheKey = `${symbol}_${interval}_${limit}`;
  const cached = candleCaches.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }

  // Try Binance first (500 candles, real volume)
  try {
    const candles = await fetchFromBinance(symbol, interval, limit);
    if (candles.length > 0) {
      candleCaches.set(cacheKey, { data: candles, fetchedAt: Date.now() });
      return candles;
    }
  } catch (err) {
    console.warn(`Binance failed for ${symbol}, trying CoinGecko:`, (err as Error).message);
  }

  // Fallback: CoinGecko OHLC
  const pair = SUPPORTED_PAIRS.find(p => p.symbol === symbol);
  if (pair) {
    try {
      const candles = await fetchFromCoinGecko(pair.coingeckoId);
      if (candles.length > 0) {
        candleCaches.set(cacheKey, { data: candles, fetchedAt: Date.now() });
        return candles;
      }
    } catch (err) {
      console.error('CoinGecko also failed:', (err as Error).message);
    }
  }

  // If we have stale cache, use it (still real data)
  if (cached) {
    console.warn('Using stale cache');
    return cached.data;
  }

  throw new Error(`All market data sources failed for ${symbol}. Check your internet connection.`);
}

/** Binance: best source — 500 candles with real volume */
async function fetchFromBinance(symbol: TradingPair, interval: string, limit: number): Promise<OHLCV[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
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

/** CoinGecko: fallback — real OHLC but no volume */
async function fetchFromCoinGecko(coingeckoId: string): Promise<OHLCV[]> {
  const url = `https://api.coingecko.com/api/v3/coins/${coingeckoId}/ohlc?vs_currency=usd&days=30`;
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
    volume: 0,
  }));
}

export function clearCandleCache(symbol?: TradingPair) {
  if (symbol) {
    for (const key of candleCaches.keys()) {
      if (key.startsWith(symbol)) candleCaches.delete(key);
    }
  } else {
    candleCaches.clear();
  }
}
