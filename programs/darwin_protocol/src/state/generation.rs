use anchor_lang::prelude::*;

#[account]
pub struct Generation {
    pub number: u16,
    pub started_at: i64,
    pub ended_at: Option<i64>,
    pub best_pnl: i64,
    pub best_agent: u64,
    pub avg_pnl: i64,
    pub agents_born: u16,
    pub agents_died: u16,
    pub bump: u8,
}

impl Generation {
    pub const SPACE: usize = 8  // discriminator
        + 2   // number
        + 8   // started_at
        + 9   // ended_at: Option<i64>
        + 8   // best_pnl
        + 8   // best_agent
        + 8   // avg_pnl
        + 2   // agents_born
        + 2   // agents_died
        + 1;  // bump

    pub const SEED_PREFIX: &'static [u8] = b"generation";
}
