use anchor_lang::prelude::*;

use crate::errors::DarwinError;
use crate::state::{AgentGenome, ProtocolState};

#[derive(Accounts)]
pub struct RecordPerformance<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [ProtocolState::SEED_PREFIX],
        bump = protocol_state.bump,
        has_one = authority @ DarwinError::Unauthorized,
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(
        mut,
        seeds = [
            AgentGenome::SEED_PREFIX,
            &agent.id.to_le_bytes(),
        ],
        bump = agent.bump,
    )]
    pub agent: Account<'info, AgentGenome>,
}

pub fn handler(
    ctx: Context<RecordPerformance>,
    pnl_bps: i64,
    trades: u32,
    wins: u32,
) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    require!(agent.is_alive, DarwinError::AgentNotAlive);

    agent.total_pnl = agent
        .total_pnl
        .checked_add(pnl_bps)
        .ok_or(DarwinError::Overflow)?;
    agent.total_trades = agent
        .total_trades
        .checked_add(trades)
        .ok_or(DarwinError::Overflow)?;

    // Recalculate win rate as basis points (0-10000)
    let total_wins = ((agent.win_rate as u64) * (agent.total_trades - trades) as u64 / 10000)
        + wins as u64;
    agent.win_rate = if agent.total_trades > 0 {
        ((total_wins * 10000) / agent.total_trades as u64) as u16
    } else {
        0
    };

    // Update protocol best if this agent is the new champion
    let state = &mut ctx.accounts.protocol_state;
    if agent.total_pnl > state.best_pnl_ever {
        state.best_pnl_ever = agent.total_pnl;
        state.best_agent_ever = agent.id;
    }

    emit!(PerformanceRecorded {
        agent_id: agent.id,
        pnl_bps,
        trades,
        wins,
        cumulative_pnl: agent.total_pnl,
    });

    Ok(())
}

#[event]
pub struct PerformanceRecorded {
    pub agent_id: u64,
    pub pnl_bps: i64,
    pub trades: u32,
    pub wins: u32,
    pub cumulative_pnl: i64,
}
