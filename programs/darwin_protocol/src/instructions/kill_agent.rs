use anchor_lang::prelude::*;

use crate::errors::DarwinError;
use crate::state::{AgentGenome, Generation, ProtocolState};

#[derive(Accounts)]
pub struct KillAgent<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
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
        constraint = agent.is_alive @ DarwinError::AlreadyDead,
    )]
    pub agent: Account<'info, AgentGenome>,

    /// Update current generation death stats
    #[account(
        mut,
        seeds = [
            Generation::SEED_PREFIX,
            &protocol_state.current_generation.to_le_bytes(),
        ],
        bump = current_generation.bump,
    )]
    pub current_generation: Account<'info, Generation>,
}

pub fn handler(ctx: Context<KillAgent>) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    let gen = &mut ctx.accounts.current_generation;
    let clock = Clock::get()?;

    agent.is_alive = false;
    agent.died_at = Some(clock.unix_timestamp);

    gen.agents_died = gen
        .agents_died
        .checked_add(1)
        .ok_or(DarwinError::Overflow)?;

    emit!(AgentDied {
        id: agent.id,
        generation: agent.generation,
        pnl: agent.total_pnl,
        trades: agent.total_trades,
    });

    msg!("Agent #{} killed in generation {}", agent.id, agent.generation);
    Ok(())
}

#[event]
pub struct AgentDied {
    pub id: u64,
    pub generation: u16,
    pub pnl: i64,
    pub trades: u32,
}
