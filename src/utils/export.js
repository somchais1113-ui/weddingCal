export function downloadText(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCalculationCSV(record, roundedMeters) {
  const rows = [
    ['Field', 'Value', 'Unit'],
    ['Component', record.type, ''],
    ['Fabric width', record.inputs.fabricWidth, 'cm'],
    ['Panel / swag count', record.result.panelCount, 'pcs'],
    ['Theoretical length', record.result.theoreticalLength / 100, 'm'],
    ['Seam allowance', record.buffers.seamBuffer, '%'],
    ['Shrinkage allowance', record.buffers.shrinkageBuffer, '%'],
    ['Pattern-match allowance', record.buffers.patternMatchBuffer, '%'],
    ['Waste allowance', record.buffers.wastageBuffer, '%'],
    ['Total allowances', record.result.totalBufferPercent, '%'],
    ['Recommended length', record.result.recommendedLength / 100, 'm'],
    ['Rounded purchase length', roundedMeters, 'm'],
    ['Ceiling calculation mode', record.result.calculationMode ?? 'N/A', ''],
    ['Inputs JSON', JSON.stringify(record.inputs), ''],
  ];
  const csv = '\uFEFF' + rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
  downloadText(`fabric-estimate-${record.type}.csv`, csv, 'text/csv;charset=utf-8');
}
