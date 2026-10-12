import assert from 'node:assert/strict';
import { calculateComponent, ceilToPurchaseIncrement, DEFAULT_ITEMS } from '../src/calculations/engine.js';
import { catenaryArcLength, catenaryHeightAt } from '../src/calculations/catenary.js';

const approx = (actual, expected, epsilon = 1e-6) => {
  assert.ok(Math.abs(actual - expected) < epsilon, `Expected ${actual} ≈ ${expected}`);
};

const backdrop = calculateComponent(structuredClone(DEFAULT_ITEMS.backdrop));
assert.equal(backdrop.result.panelCount, 7);
approx(backdrop.result.theoreticalLength, 1750);
approx(backdrop.result.recommendedLength, 1960);
assert.equal(ceilToPurchaseIncrement(backdrop.result.recommendedLength, 0.5), 20);

const ceiling = calculateComponent(structuredClone(DEFAULT_ITEMS.ceilingDrape));
approx(ceiling.result.swagLength, 448);
approx(ceiling.result.theoreticalLength, 1344);
approx(ceiling.result.recommendedLength, 1505.28);
approx(catenaryHeightAt(0, 400, 80), 80);
approx(catenaryHeightAt(200, 400, 80), 0);
approx(catenaryArcLength(400, 80), 439.8872835270466);

const accurateItem = structuredClone(DEFAULT_ITEMS.ceilingDrape);
accurateItem.inputs.calculationMode = 'exact';
const accurate = calculateComponent(accurateItem);
approx(accurate.result.theoreticalLength, catenaryArcLength(400, 80) * 3);

const noSeamTwice = structuredClone(DEFAULT_ITEMS.backdrop);
noSeamTwice.buffers = { seamBuffer: 10, shrinkageBuffer: 5, patternMatchBuffer: 0, wastageBuffer: 5 };
approx(calculateComponent(noSeamTwice).result.recommendedLength, 2100);

console.log('PASS: backdrop panel count and lengths (7 pcs, 17.5 m → 19.6 m → 20 m)');
console.log('PASS: ceiling length using brief approximation (13.44 m → 15.0528 m)');
console.log('PASS: catenary endpoint geometry and exact arc length');
console.log('PASS: optional exact mode and no double seam allowance');
