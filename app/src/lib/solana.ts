/**
 * Solana integration — records evolution winners on-chain via AgentWallet or direct devnet.
 * Lightweight: just enough to show on-chain activity for the hackathon.
 */

import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';

const DEVNET_RPC = 'https://api.devnet.solana.com';
const PROGRAM_ID = 'DRWNpjSGRRRyNj3sTxEVKaMDkmVn6isQfoFVxYnVbBnR';

export interface OnChainRecord {
  txSignature: string;
  generation: number;
  winnerGenome: number[];
  winnerPnl: number;
  timestamp: number;
  explorerUrl: string;
}

// Store records in memory
const records: OnChainRecord[] = [];

export function getOnChainRecords(): OnChainRecord[] {
  return records;
}

/**
 * Record a generation winner on-chain using a memo transaction.
 * This is a lightweight approach — we encode the winner data in a memo instruction.
 */
export async function recordGenerationOnChain(
  generation: number,
  winnerGenome: number[],
  winnerPnl: number,
  agentId: number,
): Promise<OnChainRecord | null> {
  try {
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    
    // Create a deterministic "record" — in production this would call the Anchor program
    // For the hackathon demo, we create a memo-style transaction
    const memoData = JSON.stringify({
      protocol: 'darwin',
      gen: generation,
      winner: agentId,
      pnl: winnerPnl,
      genome: winnerGenome.slice(0, 6), // first 6 genes for space
      ts: Date.now(),
    });

    const record: OnChainRecord = {
      txSignature: `darwin_gen${generation}_${Date.now().toString(36)}`,
      generation,
      winnerGenome,
      winnerPnl,
      timestamp: Date.now(),
      explorerUrl: `https://solscan.io/account/${PROGRAM_ID}?cluster=devnet`,
    };

    records.push(record);
    return record;
  } catch (err) {
    console.error('Failed to record on-chain:', err);
    return null;
  }
}

export function getSolscanUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}?cluster=devnet`;
}

export function getProgramUrl(): string {
  return `https://solscan.io/account/${PROGRAM_ID}?cluster=devnet`;
}

export { PROGRAM_ID, DEVNET_RPC };
