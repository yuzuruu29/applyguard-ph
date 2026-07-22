// Cost estimation and budget circuit breaker for Anthropic Haiku 4.5
export const HAIKU_RATES = {
  inputPerToken: 0.000001,       // $1.00 per 1M tokens
  outputPerToken: 0.000005,      // $5.00 per 1M tokens
  cacheReadPerToken: 0.0000001,  // $0.10 per 1M tokens
  cacheCreatePerToken: 0.00000125 // $1.25 per 1M tokens
};

export const DAILY_BUDGET_WARNING = 3.00;
export const DAILY_BUDGET_ADMIN_ALERT = 5.00;
export const DAILY_BUDGET_CIRCUIT_BREAKER = 10.00;

export function calculateHaikuCostUsd(usage: {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}): number {
  const input = usage.input_tokens || 0;
  const output = usage.output_tokens || 0;
  const cacheRead = usage.cache_read_input_tokens || 0;
  const cacheCreate = usage.cache_creation_input_tokens || 0;

  const cost = (input * HAIKU_RATES.inputPerToken) +
               (output * HAIKU_RATES.outputPerToken) +
               (cacheRead * HAIKU_RATES.cacheReadPerToken) +
               (cacheCreate * HAIKU_RATES.cacheCreatePerToken);
  
  return Math.round(cost * 1_000_000) / 1_000_000;
}
