use anchor_lang::prelude::*;

#[error_code]
pub enum DarwinError {
    #[msg("Invalid genome: must contain exactly 12 genes")]
    InvalidGenome,

    #[msg("Gene value out of range: must be 0-1000")]
    GeneOutOfRange,

    #[msg("Agent is not alive")]
    AgentNotAlive,

    #[msg("Unauthorized: only protocol authority can perform this action")]
    Unauthorized,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Agent has already been killed")]
    AlreadyDead,
}
