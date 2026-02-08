use anchor_lang::prelude::*;

use crate::state::ProtocolState;

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = ProtocolState::SPACE,
        seeds = [ProtocolState::SEED_PREFIX],
        bump,
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeProtocol>) -> Result<()> {
    let state = &mut ctx.accounts.protocol_state;
    state.authority = ctx.accounts.authority.key();
    state.current_generation = 0;
    state.total_agents_ever = 0;
    state.total_generations = 0;
    state.best_agent_ever = 0;
    state.best_pnl_ever = 0;
    state.bump = ctx.bumps.protocol_state;

    emit!(ProtocolInitialized {
        authority: state.authority,
    });

    msg!("Darwin protocol initialized by {}", state.authority);
    Ok(())
}

#[event]
pub struct ProtocolInitialized {
    pub authority: Pubkey,
}
