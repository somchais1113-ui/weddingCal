/**
 * Solve a symmetric catenary for a known horizontal span and vertical sag.
 * Distances are in centimetres throughout this module.
 */
export function solveCatenaryA(spanCm, sagCm) {
  if (!Number.isFinite(spanCm) || spanCm <= 0 || !Number.isFinite(sagCm) || sagCm < 0) {
    throw new RangeError('Span must be positive and sag must be non-negative.');
  }
  if (sagCm === 0) return Infinity;

  const halfSpan = spanCm / 2;
  const sagAt = (a) => {
    const t = halfSpan / a;
    return t > 50 ? Infinity : 2 * a * Math.sinh(t / 2) ** 2;
  };
  let lower = Math.max(spanCm * 1e-6, 1e-9);
  let upper = spanCm;
  while (sagAt(upper) > sagCm) upper *= 2;
  for (let i = 0; i < 90; i++) {
    const midpoint = (lower + upper) / 2;
    if (sagAt(midpoint) > sagCm) lower = midpoint;
    else upper = midpoint;
  }
  return (lower + upper) / 2;
}

export function catenaryHeightAt(xCm, spanCm, sagCm, a = solveCatenaryA(spanCm, sagCm)) {
  if (sagCm === 0) return 0;
  // Returns height above the lowest point; endpoints lie at sagCm.
  return 2 * a * Math.sinh((xCm - spanCm / 2) / (2 * a)) ** 2;
}

export function catenaryArcLength(spanCm, sagCm) {
  const a = solveCatenaryA(spanCm, sagCm);
  return !Number.isFinite(a) ? spanCm : 2 * a * Math.sinh(spanCm / (2 * a));
}

/** The brief's explicitly specified first-order approximation. */
export function estimatedSwagLength(spanCm, sagCm) {
  if (!Number.isFinite(spanCm) || spanCm <= 0 || !Number.isFinite(sagCm) || sagCm < 0) {
    throw new RangeError('Invalid ceiling dimensions.');
  }
  return spanCm * (1 + (sagCm / spanCm) * 0.6);
}
