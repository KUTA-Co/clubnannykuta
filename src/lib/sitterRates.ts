export interface SitterRateFields {
  hourlyRate?: number | string | null;
  hourlyRate1Kid?: number | string | null;
  hourlyRate2Kids?: number | string | null;
  hourlyRate3PlusKids?: number | string | null;
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function getApplicableHourlyRate(
  sitter: SitterRateFields | null | undefined,
  numberOfChildren?: number | string | null
) {
  if (!sitter) return 0;

  const childCount = Math.max(1, Number(numberOfChildren) || 1);
  const oneChildRate = toNumber(sitter.hourlyRate1Kid) || toNumber(sitter.hourlyRate);
  const twoChildRate = toNumber(sitter.hourlyRate2Kids) || oneChildRate;
  const threePlusRate = toNumber(sitter.hourlyRate3PlusKids) || twoChildRate || oneChildRate;

  if (childCount === 1) return oneChildRate;
  if (childCount === 2) return twoChildRate;
  return threePlusRate;
}

export function formatHourlyRate(rate: number) {
  return rate ? `$${rate.toFixed(rate % 1 === 0 ? 0 : 2)}` : 'Rate not set';
}

export function rateContextLabel(numberOfChildren?: number | string | null) {
  const childCount = Math.max(1, Number(numberOfChildren) || 1);
  if (childCount === 1) return 'for 1 child';
  if (childCount === 2) return 'for 2 children';
  return 'for 3+ children';
}
