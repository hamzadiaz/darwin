use anchor_lang::prelude::*;

use crate::errors::DarwinError;
use crate::state::{Generation, ProtocolState};

#[derive(Accounts)]
pub struct AdvanceGeneration<'info> {
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
        space = Generation::SPACE,
        seeds = [
            Generation::SEED_PREFIX,
            &(protocol_state.current_generation + 1).to_le_bytes(),
        ],
        bump,
    )]
    pub new_generation: Account<'info, Generation>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AdvanceGeneration>) -> Result<()> {
    let state = &mut ctx.accounts.protocol_state;
    let clock = Clock::get()?;

    let new_gen_number = state
        .current_generation
        .checked_add(1)
        .ok_or(DarwinError::Overflow)?;

    let gen = &mut ctx.accounts.new_generation;
    gen.number = new_gen_number;
    gen.started_at = clock.unix_timestamp;
    gen.ended_at = None;
    gen.best_pnl = 0;
    gen.best_agent = 0;
    gen.avg_pnl = 0;
    gen.agents_born = 0;
    gen.agents_died = 0;
    gen.bump = ctx.bumps.new_generation;

    state.current_generation = new_gen_number;
    state.total_generations = state
        .total_generations
        .checked_add(1)
        .ok_or(DarwinError::Overflow)?;

    emit!(GenerationAdvanced {
        generation: new_gen_number,
        timestamp: clock.unix_timestamp,
    });

    msg!("Advanced to generation {}", new_gen_number);
    Ok(())
}

#[event]
pub struct GenerationAdvanced {
    pub generation: u16,
    pub timestamp: i64,
}
