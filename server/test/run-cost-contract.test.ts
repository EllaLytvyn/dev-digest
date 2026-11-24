import { describe, it, expect } from 'vitest';
import { RunTrace } from '@devdigest/shared';

/** M1 Run Cost Badge — `run_traces.trace` jsonb written before M1 has no `stats.cost_usd`. */
describe('RunTrace cost_usd (M1)', () => {
  const base = {
    config: { agent: 'Sec', model: 'm' },
    prompt_assembly: { system: 's', user: 'u' },
    tool_calls: [],
    raw_output: '',
    memory_pulled: [],
    specs_read: [],
    log: [],
  };
  const stats = { duration_ms: 1, tokens_in: 1, tokens_out: 1, findings: 0, grounding: '0/0 passed' };

  it('parses a pre-M1 trace without cost_usd', () => {
    const parsed = RunTrace.parse({ ...base, stats });
    expect(parsed.stats.cost_usd).toBeUndefined();
  });

  it('keeps cost_usd (number or null) when present', () => {
    expect(RunTrace.parse({ ...base, stats: { ...stats, cost_usd: 0.0006 } }).stats.cost_usd).toBe(0.0006);
    expect(RunTrace.parse({ ...base, stats: { ...stats, cost_usd: null } }).stats.cost_usd).toBeNull();
  });
});
