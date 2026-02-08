use anchor_lang::prelude::*;

#[account]
pub struct AgentGenome {
    pub id: u64,
    pub generation: u16,
    pub parent_a: Option<u64>,
    pub parent_b: Option<u64>,
    pub genome: [u16; 12],
    pub born_at: i64,
    pub died_at: Option<i64>,
    pub total_pnl: i64,
    pub total_trades: u32,
    pub win_rate: u16,
    pub is_alive: bool,
    pub owner: Pubkey,
    pub bump: u8,
}

impl AgentGenome {
    // Option<u64> = 1 + 8 = 9 bytes, Option<i64> = 1 + 8 = 9 bytes
    pub const SPACE: usize = 8  // discriminator
        + 8   // id
        + 2   // generation
        + 9   // parent_a: Option<u64>
        + 9   // parent_b: Option<u64>
        + 24  // genome: [u16; 12]
        + 8   // born_at
        + 9   // died_at: Option<i64>
        + 8   // total_pnl
        + 4   // total_trades
        + 2   // win_rate
        + 1   // is_alive
        + 32  // owner
        + 1;  // bump

    pub const SEED_PREFIX: &'static [u8] = b"agent";
}
