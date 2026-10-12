import { calculateBackdrop } from './backdrop.js';
import { calculateCeilingDrape } from './ceilingDrape.js';

export const COMPONENT_TYPES = {
  backdrop: 'ฉากหลังผ้าจีบ',
  ceilingDrape: 'ผ้าหย่อนเพดาน',
};

export const DEFAULT_BUFFERS = Object.freeze({
  seamBuffer: 7,
  shrinkageBuffer: 0,
  patternMatchBuffer: 0,
  wastageBuffer: 5,
});

export const DEFAULT_ITEMS = {
  backdrop: {
    id: 'backdrop-example',
    type: 'backdrop',
    inputs: {
      fabricWidth: 150,
      fullnessRatio: 2,
      dimensions: { backdropWidth: 500, backdropHeight: 250 },
    },
    buffers: { ...DEFAULT_BUFFERS },
  },
  ceilingDrape: {
    id: 'ceiling-example',
    type: 'ceilingDrape',
    inputs: {
      fabricWidth: 150,
      fullnessRatio: 1,
      calculationMode: 'brief',
      dimensions: { spanDistance: 400, sagDepth: 80, numberOfSwags: 3 },
    },
    buffers: { ...DEFAULT_BUFFERS },
  },
};

function assertPositive(value, key) {
  if (!Number.isFinite(value) || value <= 0 || value > 100000) {
    throw new RangeError(`${key} must be greater than zero and at most 100000.`);
  }
}
function assertNonNegative(value, key) {
  if (!Number.isFinite(value) || value < 0 || value > 100000) {
    throw new RangeError(`${key} must be a non-negative finite number.`);
  }
}

export function validateComponent(item) {
  if (!item || !COMPONENT_TYPES[item.type]) throw new RangeError('Unknown component type.');
  const { inputs, buffers } = item;
  if (!inputs || !inputs.dimensions || !buffers) throw new RangeError('Missing calculation inputs.');
  assertPositive(inputs.fabricWidth, 'fabricWidth');
  if (item.type === 'backdrop') {
    assertPositive(inputs.fullnessRatio, 'fullnessRatio');
    if (inputs.fullnessRatio > 10) throw new RangeError('Fullness ratio must be at most 10.');
    assertPositive(inputs.dimensions.backdropWidth, 'backdropWidth');
    assertPositive(inputs.dimensions.backdropHeight, 'backdropHeight');
    const panels = Math.ceil(inputs.dimensions.backdropWidth * inputs.fullnessRatio / inputs.fabricWidth);
    if (panels > 500) throw new RangeError('A maximum of 500 panels is supported in the preview.');
  } else {
    assertPositive(inputs.dimensions.spanDistance, 'spanDistance');
    assertNonNegative(inputs.dimensions.sagDepth, 'sagDepth');
    const count = inputs.dimensions.numberOfSwags;
    if (!Number.isInteger(count) || count < 1 || count > 80) {
      throw new RangeError('numberOfSwags must be an integer from 1 to 80.');
    }
    if (!['brief', 'exact'].includes(inputs.calculationMode ?? 'brief')) {
      throw new RangeError('Invalid ceiling calculation mode.');
    }
  }
  for (const key of Object.keys(DEFAULT_BUFFERS)) {
    const buffer = buffers[key];
    if (!Number.isFinite(buffer) || buffer < 0 || buffer > 100) {
      throw new RangeError(`${key} must be a percentage from 0 to 100.`);
    }
  }
  return true;
}

/**
 * Both approaches produce a STRICTLY unbuffered theoretical length.
 * Add each allowance once here; don't also multiply the geometry by seam allowance.
 */
export function calculateComponent(item) {
  validateComponent(item);
  const details = item.type === 'backdrop'
    ? calculateBackdrop(item.inputs)
    : calculateCeilingDrape({ ...item.inputs, calculationMode: item.inputs.calculationMode ?? 'brief' });
  const totalBufferPercent = Object.keys(DEFAULT_BUFFERS)
    .reduce((sum, key) => sum + item.buffers[key], 0);
  const recommendedLength = details.theoreticalLength * (1 + totalBufferPercent / 100);
  return {
    id: item.id,
    type: item.type,
    inputs: structuredClone(item.inputs),
    buffers: { ...item.buffers },
    result: {
      theoreticalLength: details.theoreticalLength,
      recommendedLength,
      panelCount: details.panelCount,
      totalBufferPercent,
      ...(item.type === 'backdrop'
        ? { effectiveFullness: details.effectiveFullness }
        : {
          swagLength: details.swagLength,
          exactPerSwag: details.exactPerSwag,
          estimatedPerSwag: details.estimatedPerSwag,
          geometryDifferencePercent: details.geometryDifferencePercent,
          calculationMode: details.calculationMode,
        }),
    },
    sceneParams: details.sceneParams,
  };
}

export function ceilToPurchaseIncrement(cm, incrementMeters = 0.5) {
  assertPositive(incrementMeters, 'incrementMeters');
  return Math.ceil((cm / 100 - 1e-10) / incrementMeters) * incrementMeters;
}
