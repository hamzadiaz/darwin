use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("DRWNpjSGRRRyNj3sTxEVKaMDkmVn6isQfoFVxYnVbBnR");

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

    /// Record an agent's performance for the current round.
    pub fn record_performance(
        ctx: Context<RecordPerformance>,
        pnl_bps: i64,
        trades: u32,
        wins: u32,
    ) -> Result<()> {
        instructions::record_performance::handler(ctx, pnl_bps, trades, wins)
    }

    /// Advance to the next generation. Only callable by authority.
    pub fn advance_generation(ctx: Context<AdvanceGeneration>) -> Result<()> {
        instructions::advance_generation::handler(ctx)
    }
}
