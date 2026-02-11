/**
 * Client-side Solana transaction builder.
 * Sends real memo transactions on devnet signed by user's Phantom wallet.
 */
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

const DEVNET_RPC = 'https://api.devnet.solana.com';
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey: PublicKey;
  connect: () => Promise<{ publicKey: PublicKey }>;
  signAndSendTransaction: (tx: Transaction) => Promise<{ signature: string }>;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
}

function getPhantom(): PhantomProvider | null {
  const win = window as unknown as { solana?: PhantomProvider };
  if (win.solana?.isPhantom) return win.solana;
  return null;
}

export interface OnChainResult {
  signature: string;
  explorerUrl: string;
  generation: number;
  pnl: number;
}

/**
 * Record a generation winner on-chain via Phantom wallet.
 * Uses the Memo program to store genome data in a transaction memo.
 */
export async function recordOnChainWithWallet(
  generation: number,
  winnerGenome: number[],
  winnerPnl: number,
  agentId: number,
): Promise<OnChainResult> {
  const phantom = getPhantom();
  if (!phantom || !phantom.publicKey) {
    throw new Error('Phantom wallet not connected');
  }

  const connection = new Connection(DEVNET_RPC, 'confirmed');

  // Build memo data: compact representation of the winner
  const memoData = JSON.stringify({
    p: 'darwin',
    g: generation,
    a: agentId,
    pnl: winnerPnl,
    genome: winnerGenome.slice(0, 22), // ensure max 22 genes
  });

  // Create memo instruction
  const memoIx = new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoData, 'utf-8'),
  });

  const tx = new Transaction().add(memoIx);
  tx.feePayer = phantom.publicKey;

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;

  // Sign and send via Phantom
  const { signature } = await phantom.signAndSendTransaction(tx);

  // Confirm
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  }, 'confirmed');

  return {
    signature,
    explorerUrl: `https://solscan.io/tx/${signature}?cluster=devnet`,
    generation,
    pnl: winnerPnl,
  };
}

/**
 * Record multiple generations in batch (one tx per gen to avoid size limits).
 */
export async function recordBatchOnChain(
  generations: { number: number; bestPnl: number; bestAgent: number; winnerGenome: number[] }[],
  onProgress?: (done: number, total: number) => void,
): Promise<OnChainResult[]> {
  const results: OnChainResult[] = [];
  
  for (let i = 0; i < generations.length; i++) {
    const gen = generations[i];
    try {
      const result = await recordOnChainWithWallet(
        gen.number,
        gen.winnerGenome,
        gen.bestPnl,
        gen.bestAgent,
      );
      results.push(result);
      onProgress?.(i + 1, generations.length);
    } catch (err) {
      console.error(`Failed to record gen ${gen.number}:`, err);
      // Continue with remaining gens
    }
    
    // Small delay between txs to avoid rate limiting
    if (i < generations.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  return results;
}

export function isPhantomConnected(): boolean {
  const phantom = getPhantom();
  return !!phantom?.publicKey;
}
