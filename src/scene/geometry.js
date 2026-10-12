import * as THREE from 'three';
import { catenaryHeightAt, solveCatenaryA } from '../calculations/catenary.js';

function makeGeometry(positions, indices, uvs) {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

export function surfaceArcRatio(amplitude, projectedWidth, cycles = 2) {
  const samples = 256;
  const k = (2 * Math.PI * cycles) / projectedWidth;
  let total = 0;
  for (let i = 0; i < samples; i++) {
    const x = ((i + 0.5) / samples) * projectedWidth;
    const slope = amplitude * k * Math.cos(k * x);
    total += Math.sqrt(1 + slope * slope);
  }
  return total / samples;
}

/** Fit the displayed horizontal pleats to actual flat fabric width (per panel). */
export function solvePleatAmplitude(projectedWidth, flatWidth, cycles = 2) {
  if (projectedWidth <= 0 || flatWidth <= projectedWidth) return 0;
  let low = 0;
  let high = projectedWidth;
  while (surfaceArcRatio(high, projectedWidth, cycles) < flatWidth / projectedWidth) high *= 2;
  for (let i = 0; i < 36; i++) {
    const mid = (low + high) / 2;
    if (surfaceArcRatio(mid, projectedWidth, cycles) < flatWidth / projectedWidth) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

export function createBackdropPanelGeometry(projectedWidth, height, flatWidth) {
  const columns = 64;
  const rows = 32;
  const positions = [];
  const uvs = [];
  const indices = [];
  const amplitude = solvePleatAmplitude(projectedWidth, flatWidth, 2);
  for (let j = 0; j <= rows; j++) {
    const v = j / rows;
    for (let i = 0; i <= columns; i++) {
      const u = i / columns;
      const x = u * projectedWidth;
      const z = amplitude * Math.sin(4 * Math.PI * u);
      positions.push(x, height * v, z);
      uvs.push(u, v);
    }
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const a = j * (columns + 1) + i;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  return makeGeometry(positions, indices, uvs);
}

export function createCeilingSwagGeometry(spanCm, sagCm, widthCm, anchorHeightM) {
  const columns = 84;
  const rows = 28;
  const positions = [];
  const uvs = [];
  const indices = [];
  const a = solveCatenaryA(spanCm, sagCm);
  for (let i = 0; i <= columns; i++) {
    const u = i / columns;
    const xCm = spanCm * u;
    const yM = anchorHeightM - (sagCm - catenaryHeightAt(xCm, spanCm, sagCm, a)) / 100;
    for (let j = 0; j <= rows; j++) {
      const v = j / rows;
      // Light transverse weave waves vanish at the fixing points.
      const ripple = 0.008 * Math.sin(v * 8 * Math.PI) * Math.sin(u * Math.PI);
      positions.push((xCm - spanCm / 2) / 100, yM + ripple, (v - 0.5) * widthCm / 100);
      uvs.push(u, v);
    }
  }
  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      const p = i * (rows + 1) + j;
      const q = p + rows + 1;
      indices.push(p, p + 1, q, p + 1, q + 1, q);
    }
  }
  return makeGeometry(positions, indices, uvs);
}
