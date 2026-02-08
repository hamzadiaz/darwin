use anchor_lang::prelude::*;

use crate::errors::DarwinError;
use crate::state::{AgentGenome, Generation, ProtocolState};

#[derive(Accounts)]
pub struct Breed<'info> {
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
        seeds = [
            AgentGenome::SEED_PREFIX,
            &parent_a.id.to_le_bytes(),
        ],
        bump = parent_a.bump,
        constraint = parent_a.is_alive @ DarwinError::AgentNotAlive,
    )]
    pub parent_a: Account<'info, AgentGenome>,

    #[account(
        seeds = [
            AgentGenome::SEED_PREFIX,
            &parent_b.id.to_le_bytes(),
        ],
        bump = parent_b.bump,
        constraint = parent_b.is_alive @ DarwinError::AgentNotAlive,
    )]
    pub parent_b: Account<'info, AgentGenome>,

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
    pub child: Account<'info, AgentGenome>,

    /// Optional: update current generation stats
    #[account(
        mut,
        seeds = [
            Generation::SEED_PREFIX,
            &protocol_state.current_generation.to_le_bytes(),
        ],
        bump = current_generation.bump,
    )]
    pub current_generation: Account<'info, Generation>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Breed>, child_genome: [u16; 22]) -> Result<()> {
    // Validate genome
    for &gene in child_genome.iter() {
        require!(gene <= 1000, DarwinError::GeneOutOfRange);
    }

    let state = &mut ctx.accounts.protocol_state;
    let parent_a = &ctx.accounts.parent_a;
    let parent_b = &ctx.accounts.parent_b;
    let child = &mut ctx.accounts.child;
    let gen = &mut ctx.accounts.current_generation;
    let clock = Clock::get()?;

    let child_id = state.total_agents_ever;

    child.id = child_id;
    child.generation = state.current_generation;
    child.parent_a = Some(parent_a.id);
    child.parent_b = Some(parent_b.id);
    child.genome = child_genome;
    child.born_at = clock.unix_timestamp;
    child.died_at = None;
    child.total_pnl = 0;
    child.total_trades = 0;
    child.total_wins = 0;
    child.win_rate = 0;
    child.is_alive = true;
    child.owner = ctx.accounts.authority.key();
    child.bump = ctx.bumps.child;

    state.total_agents_ever = state
        .total_agents_ever
        .checked_add(1)
        .ok_or(DarwinError::Overflow)?;

    gen.agents_born = gen
        .agents_born
        .checked_add(1)
        .ok_or(DarwinError::Overflow)?;

    emit!(AgentBred {
        child_id,
        parent_a: parent_a.id,
        parent_b: parent_b.id,
        generation: child.generation,
        genome: child_genome,
    });

    msg!(
        "Agent #{} bred from parents #{} and #{} in generation {}",
        child_id, parent_a.id, parent_b.id, child.generation
    );
    Ok(())
}

#[event]
pub struct AgentBred {
    pub child_id: u64,
    pub parent_a: u64,
    pub parent_b: u64,
    pub generation: u16,
    pub genome: [u16; 22],
}
