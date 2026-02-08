use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("DRWNpjSGRRRyNj3sTxEVKaMDkmVn6isQfoFVxYnVbBnR");

/// Darwin Protocol — Evolutionary Trading Agents on Solana
///
/// Agents have genomes (12 genes, 0-1000 each) that determine trading behavior.
/// They compete across generations, breed the best performers, and kill the worst.
/// Natural selection for alpha.
#[program]
pub mod darwin_protocol {
    use super::*;

    /// Initialize the protocol state. Called once by the deployer.
    pub fn initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
        instructions::initialize_protocol::handler(ctx)
    }

    /// Spawn a new agent with the given genome (12 genes, each 0-1000).
    pub fn spawn_agent(ctx: Context<SpawnAgent>, genome: [u16; 12]) -> Result<()> {
        instructions::spawn_agent::handler(ctx, genome)
    }

    /// Record an agent's trading performance.
    pub fn record_performance(
        ctx: Context<RecordPerformance>,
        pnl_bps: i64,
        trades: u32,
        wins: u32,
    ) -> Result<()> {
        instructions::record_performance::handler(ctx, pnl_bps, trades, wins)
    }

    /// Breed two parent agents to create a child with a new genome.
    pub fn breed(ctx: Context<Breed>, child_genome: [u16; 12]) -> Result<()> {
        instructions::breed::handler(ctx, child_genome)
    }

    /// Kill an underperforming agent. Sets is_alive=false.
    pub fn kill_agent(ctx: Context<KillAgent>) -> Result<()> {
        instructions::kill_agent::handler(ctx)
    }

    /// Advance to the next generation. Only callable by authority.
    pub fn advance_generation(ctx: Context<AdvanceGeneration>) -> Result<()> {
        instructions::advance_generation::handler(ctx)
    }
}
