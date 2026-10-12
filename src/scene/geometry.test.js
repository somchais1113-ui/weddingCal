import { describe, expect, it } from 'vitest';
import { createBackdropPanelGeometry, createCeilingSwagGeometry, solvePleatAmplitude, surfaceArcRatio } from './geometry.js';

describe('parametric display geometries', () => {
  it('sets backdrop pleat amplitude to account for unrolled fabric width', () => {
    const amplitude = solvePleatAmplitude(0.75, 1.5);
    expect(amplitude).toBeGreaterThan(0);
    expect(surfaceArcRatio(amplitude, 0.75)).toBeCloseTo(2, 2);
    expect(solvePleatAmplitude(1.5, 1.5)).toBe(0);
  });
  it('constructs nonempty reusable indexed geometries', () => {
    const backdrop = createBackdropPanelGeometry(0.75, 2.5, 1.5);
    expect(backdrop.getAttribute('position').count).toBeGreaterThan(2000);
    expect(backdrop.index.count).toBeGreaterThan(0);
    backdrop.dispose();
    const ceiling = createCeilingSwagGeometry(400, 80, 150, 3.2);
    expect(ceiling.getAttribute('position').count).toBeGreaterThan(2000);
    ceiling.dispose();
  });
});
