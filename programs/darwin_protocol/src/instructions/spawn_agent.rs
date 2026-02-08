use anchor_lang::prelude::*;

use crate::errors::DarwinError;
use crate::state::{AgentGenome, ProtocolState};

#[derive(Accounts)]
pub struct SpawnAgent<'info> {
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
        init,
        payer = authority,
        space = AgentGenome::SPACE,
        seeds = [
            AgentGenome::SEED_PREFIX,
            &protocol_state.total_agents_ever.to_le_bytes(),
        ],
        bump,
    )]
    pub agent: Account<'info, AgentGenome>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SpawnAgent>, genome: [u16; 12]) -> Result<()> {
    // Validate all genes are in range 0-1000
    for &gene in genome.iter() {
        require!(gene <= 1000, DarwinError::GeneOutOfRange);
    }

    let state = &mut ctx.accounts.protocol_state;
    let agent = &mut ctx.accounts.agent;
    let clock = Clock::get()?;

    let agent_id = state.total_agents_ever;

    agent.id = agent_id;
    agent.generation = state.current_generation;
    agent.parent_a = None;
    agent.parent_b = None;
    agent.genome = genome;
    agent.born_at = clock.unix_timestamp;
    agent.died_at = None;
    agent.total_pnl = 0;
    agent.total_trades = 0;
    agent.win_rate = 0;
    agent.is_alive = true;
    agent.owner = ctx.accounts.authority.key();
    agent.bump = ctx.bumps.agent;

    state.total_agents_ever = state
        .total_agents_ever
        .checked_add(1)
        .ok_or(DarwinError::Overflow)?;

    emit!(AgentSpawned {
        id: agent_id,
        generation: agent.generation,
        genome,
        owner: agent.owner,
    });

    msg!("Agent #{} spawned in generation {}", agent_id, agent.generation);
    Ok(())
}

#[event]
pub struct AgentSpawned {
    pub id: u64,
    pub generation: u16,
    pub genome: [u16; 12],
    pub owner: Pubkey,
}
