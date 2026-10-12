import { catenaryArcLength, estimatedSwagLength } from './catenary.js';

export function calculateCeilingDrape({ fabricWidth, dimensions, calculationMode = 'brief' }) {
  const { spanDistance, sagDepth, numberOfSwags } = dimensions;
  const estimatedPerSwag = estimatedSwagLength(spanDistance, sagDepth);
  const exactPerSwag = catenaryArcLength(spanDistance, sagDepth);
  const selectedPerSwag = calculationMode === 'exact' ? exactPerSwag : estimatedPerSwag;
  return {
    theoreticalLength: selectedPerSwag * numberOfSwags,
    panelCount: numberOfSwags,
    swagLength: selectedPerSwag,
    estimatedPerSwag,
    exactPerSwag,
    geometryDifferencePercent: estimatedPerSwag === 0 ? 0 : 100 * (exactPerSwag - estimatedPerSwag) / estimatedPerSwag,
    calculationMode,
    sceneParams: {
      kind: 'ceilingDrape',
      spanCm: spanDistance,
      sagCm: sagDepth,
      numberOfSwags,
      fabricWidthCm: fabricWidth,
    },
  };
}
