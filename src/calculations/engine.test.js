import { describe, expect, it } from 'vitest';
import { calculateComponent, ceilToPurchaseIncrement, DEFAULT_ITEMS } from './engine.js';
import { calculateBackdrop } from './backdrop.js';
import { calculateCeilingDrape } from './ceilingDrape.js';
import { catenaryArcLength, catenaryHeightAt, estimatedSwagLength, solveCatenaryA } from './catenary.js';

const clone = (value) => structuredClone(value);

describe('backdrop production quantities', () => {
  it('calculates the required 500 x 250 cm backdrop, 150 cm roll at 2x fullness', () => {
    const item = calculateComponent(clone(DEFAULT_ITEMS.backdrop));
    expect(item.result.panelCount).toBe(7);
    expect(item.result.theoreticalLength).toBe(1750);
    expect(item.result.recommendedLength).toBeCloseTo(1960);
    expect(item.result.effectiveFullness).toBeCloseTo(2.1);
    expect(ceilToPurchaseIncrement(item.result.recommendedLength)).toBe(20);
  });

  it('rounds panel count up at roll boundaries', () => {
    const inputs = clone(DEFAULT_ITEMS.backdrop.inputs);
    inputs.fullnessRatio = 1.5;
    expect(calculateBackdrop(inputs).panelCount).toBe(5);
    inputs.dimensions.backdropWidth = 501;
    expect(calculateBackdrop(inputs).panelCount).toBe(6);
  });

  it('does not count seam allowance twice', () => {
    const input = clone(DEFAULT_ITEMS.backdrop);
    input.buffers = { seamBuffer: 10, shrinkageBuffer: 5, patternMatchBuffer: 0, wastageBuffer: 5 };
    const result = calculateComponent(input);
    expect(result.result.theoreticalLength).toBe(1750);
    expect(result.result.recommendedLength).toBe(2100);
    expect(result.result.totalBufferPercent).toBe(20);
  });
});

describe('ceiling drape production quantities', () => {
  it('uses the brief approximation: 400 cm span, 80 cm sag, 3 swags', () => {
    const result = calculateComponent(clone(DEFAULT_ITEMS.ceilingDrape));
    expect(result.result.swagLength).toBeCloseTo(448);
    expect(result.result.theoreticalLength).toBeCloseTo(1344);
    expect(result.result.recommendedLength).toBeCloseTo(1505.28);
    expect(result.result.panelCount).toBe(3);
  });
  it('can use the true catenary arc length rather than the approximation', () => {
    const item = clone(DEFAULT_ITEMS.ceilingDrape);
    item.inputs.calculationMode = 'exact';
    const result = calculateComponent(item);
    expect(result.result.theoreticalLength).toBeCloseTo(catenaryArcLength(400, 80) * 3, 7);
    expect(result.result.theoreticalLength).toBeGreaterThan(1200);
    expect(result.sceneParams.spanCm).toBe(400);
  });
  it('has no sag when sagDepth = 0', () => {
    expect(estimatedSwagLength(400, 0)).toBe(400);
    expect(catenaryArcLength(400, 0)).toBe(400);
    expect(catenaryHeightAt(200, 400, 0)).toBe(0);
  });
  it('satisfies physical anchor and lowest-point constraints', () => {
    const a = solveCatenaryA(400, 80);
    expect(a).toBeGreaterThan(0);
    expect(catenaryHeightAt(0, 400, 80, a)).toBeCloseTo(80, 8);
    expect(catenaryHeightAt(200, 400, 80, a)).toBeCloseTo(0, 8);
    expect(catenaryHeightAt(400, 400, 80, a)).toBeCloseTo(80, 8);
  });
});

describe('input validation and rounding', () => {
  it('rejects negative and zero dimensions', () => {
    const item = clone(DEFAULT_ITEMS.backdrop);
    item.inputs.fabricWidth = 0;
    expect(() => calculateComponent(item)).toThrow(RangeError);
  });
  it('rejects a fractional number of swags', () => {
    const item = clone(DEFAULT_ITEMS.ceilingDrape);
    item.inputs.dimensions.numberOfSwags = 1.5;
    expect(() => calculateComponent(item)).toThrow(RangeError);
  });
  it('rejects negative allowances', () => {
    const item = clone(DEFAULT_ITEMS.backdrop);
    item.buffers.wastageBuffer = -1;
    expect(() => calculateComponent(item)).toThrow(RangeError);
  });
  it('rounds up to the requested purchase increments', () => {
    expect(ceilToPurchaseIncrement(1960, 0.5)).toBe(20);
    expect(ceilToPurchaseIncrement(2000, 0.5)).toBe(20);
    expect(ceilToPurchaseIncrement(1960, 1)).toBe(20);
    expect(ceilToPurchaseIncrement(2001, 1)).toBe(21);
  });
});
