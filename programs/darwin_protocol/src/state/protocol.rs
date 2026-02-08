use anchor_lang::prelude::*;

#[account]
pub struct ProtocolState {
    pub authority: Pubkey,
    pub current_generation: u16,
    pub total_agents_ever: u64,
    pub total_generations: u16,
    pub best_agent_ever: u64,
    pub best_pnl_ever: i64,
    pub bump: u8,
}

impl ProtocolState {
    pub const SPACE: usize = 8  // discriminator
        + 32  // authority
        + 2   // current_generation
        + 8   // total_agents_ever
        + 2   // total_generations
        + 8   // best_agent_ever
        + 8   // best_pnl_ever
        + 1;  // bump

    pub const SEED_PREFIX: &'static [u8] = b"protocol";
}
