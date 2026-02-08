/**
 * Predefined market periods for evolution and battle testing.
 */

export interface MarketPeriod {
  label: string;
  days?: number | null;
  start?: string;
  end?: string;
}

export const MARKET_PERIODS: Record<string, MarketPeriod> = {
  'last-30d': { label: 'Last 30 Days', days: 30 },
  'last-90d': { label: 'Last 90 Days', days: 90 },
  'last-1y': { label: 'Last Year', days: 365 },
  'bull-2024': { label: 'Bull Run 2024', start: '2023-10-01', end: '2024-03-31' },
  'bear-2022': { label: 'Bear Market 2022', start: '2022-05-01', end: '2022-12-31' },
  'crash-2021': { label: 'May 2021 Crash', start: '2021-05-01', end: '2021-07-31' },
  'full-history': { label: 'Full History', days: null },
};

export type PeriodId = keyof typeof MARKET_PERIODS;

/** Periods used in battle testing */
export const BATTLE_TEST_PERIODS: PeriodId[] = [
  'bull-2024',
  'bear-2022',
  'crash-2021',
  'last-90d',
];

/**
 * Resolve a period to start/end timestamps (ms).
 * For relative periods (days), calculates from now.
 * For full-history, returns earliest available date for the pair.
 */
export function resolvePeriodDates(periodId: PeriodId): { startTime: number; endTime: number } {
  const period = MARKET_PERIODS[periodId];
  if (!period) throw new Error(`Unknown period: ${periodId}`);

  const now = Date.now();

  if (period.start && period.end) {
    return {
      startTime: new Date(period.start).getTime(),
      endTime: new Date(period.end).getTime(),
    };
  }

  if (period.days === null) {
    // Full history — go back ~5 years (will be capped by available data)
    return {
      startTime: new Date('2017-08-17').getTime(),
      endTime: now,
    };
  }

  if (period.days) {
    return {
      startTime: now - period.days * 24 * 60 * 60 * 1000,
      endTime: now,
    };
  }

  // Fallback: last 90 days
  return {
    startTime: now - 90 * 24 * 60 * 60 * 1000,
    endTime: now,
  };
}
