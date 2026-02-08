/**
 * Jupiter DEX Integration — SOL/USDC swaps on Solana
 * Uses Jupiter Aggregator V6 API (free, no key needed)
 */

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';

export interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  routePlan: { swapInfo: { label: string } }[];
  otherAmountThreshold: string;
  swapMode: string;
}

export interface SwapResult {
  swapTransaction: string; // base64 encoded transaction
  lastValidBlockHeight: number;
}

/**
 * Get a Jupiter quote for a token swap
 * @param inputMint Input token mint address
 * @param outputMint Output token mint address
 * @param amount Amount in smallest unit (lamports for SOL, 1e6 for USDC)
 * @param slippageBps Slippage tolerance in basis points (default 50 = 0.5%)
 */
export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps = 50,
): Promise<JupiterQuote | null> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
    });

    const res = await fetch(`${JUPITER_QUOTE_API}?${params}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error('Jupiter quote error:', res.status);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('Jupiter quote failed:', err);
    return null;
  }
}

/**
 * Execute a swap via Jupiter (requires connected wallet)
 * Returns the serialized transaction to be signed by the wallet
 */
export async function executeSwap(
  userPublicKey: string,
  quote: JupiterQuote,
): Promise<SwapResult | null> {
  try {
    const res = await fetch(JUPITER_SWAP_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error('Jupiter swap error:', res.status);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('Jupiter swap failed:', err);
    return null;
  }
}

/**
 * Get a Jupiter swap URL for manual execution
 */
export function getJupiterSwapUrl(
  inputMint: string,
  outputMint: string,
  amount?: number,
): string {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
  });
  if (amount) params.set('amount', amount.toString());
  return `https://jup.ag/swap/${inputMint === SOL_MINT ? 'SOL' : 'USDC'}-${outputMint === SOL_MINT ? 'SOL' : 'USDC'}`;
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.round(sol * 1e9);
}

/**
 * Convert USDC to smallest unit
 */
export function usdcToSmallest(usdc: number): number {
  return Math.round(usdc * 1e6);
}

/**
 * Format lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / 1e9;
}
