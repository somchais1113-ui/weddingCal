export function calculateBackdrop({ fabricWidth, fullnessRatio, dimensions }) {
  const { backdropWidth, backdropHeight } = dimensions;
  const panelCount = Math.ceil((backdropWidth * fullnessRatio) / fabricWidth);
  const theoreticalLength = panelCount * backdropHeight;
  return {
    theoreticalLength,
    panelCount,
    widthToCover: backdropWidth,
    effectiveFullness: (panelCount * fabricWidth) / backdropWidth,
    sceneParams: {
      kind: 'backdrop',
      widthCm: backdropWidth,
      heightCm: backdropHeight,
      fabricWidthCm: fabricWidth,
      panelCount,
    },
  };
}
