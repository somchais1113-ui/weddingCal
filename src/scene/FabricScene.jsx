import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { createBackdropPanelGeometry, createCeilingSwagGeometry } from './geometry.js';

function Cloth({ geometry, color, opacity = 1 }) {
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        side={THREE.DoubleSide}
        roughness={0.93}
        metalness={0}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

function Bar({ from, to, radius = 0.024, color = '#899bb4' }) {
  const { center, length, rotation } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const delta = b.clone().sub(a);
    const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
    return { center: a.add(b).multiplyScalar(0.5), length: delta.length(), rotation };
  }, [from.join(), to.join()]);
  return (
    <mesh position={center} quaternion={rotation} castShadow>
      <cylinderGeometry args={[radius, radius, length, 10]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.27} />
    </mesh>
  );
}

function Label3D({ position, children }) {
  return (
    <Html position={position} center distanceFactor={10} style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
      <div className="dimension-tag">{children}</div>
    </Html>
  );
}

function BackdropModel({ params, color }) {
  const { widthCm, heightCm, fabricWidthCm, panelCount } = params;
  const w = widthCm / 100;
  const h = heightCm / 100;
  const projectedPanel = w / panelCount;
  const geom = useMemo(() => createBackdropPanelGeometry(projectedPanel, h, fabricWidthCm / 100), [projectedPanel, h, fabricWidthCm]);
  useEffect(() => () => geom.dispose(), [geom]);
  const panels = useMemo(() => Array.from({ length: panelCount }, (_, index) => index), [panelCount]);
  return (
    <group>
      <mesh position={[0, 0.045, 0.25]} receiveShadow>
        <boxGeometry args={[w + 0.85, 0.09, 1.85]} />
        <meshStandardMaterial color="#e7ebf1" roughness={0.84} />
      </mesh>
      {panels.map((index) => (
        <group key={index} position={[-w / 2 + index * projectedPanel, 0.10, 0]}>
          <Cloth geometry={geom} color={color} />
        </group>
      ))}
      <Bar from={[-w / 2 - 0.13, h + 0.14, -0.06]} to={[w / 2 + 0.13, h + 0.14, -0.06]} />
      <Bar from={[-w / 2 - 0.13, 0.12, -0.06]} to={[-w / 2 - 0.13, h + 0.14, -0.06]} radius={0.018} />
      <Bar from={[w / 2 + 0.13, 0.12, -0.06]} to={[w / 2 + 0.13, h + 0.14, -0.06]} radius={0.018} />
      <Bar from={[-w / 2 - 0.35, 0.11, -0.36]} to={[-w / 2 + 0.12, 0.11, 0.26]} radius={0.019} />
      <Bar from={[w / 2 - 0.12, 0.11, 0.26]} to={[w / 2 + 0.35, 0.11, -0.36]} radius={0.019} />
      <Label3D position={[0, h + 0.53, 0]}>{(widthCm / 100).toFixed(2)} ม.</Label3D>
      <Label3D position={[w / 2 + 0.48, h / 2, 0]}>{(heightCm / 100).toFixed(2)} ม.</Label3D>
    </group>
  );
}

function CeilingModel({ params, color }) {
  const { spanCm, sagCm, numberOfSwags, fabricWidthCm } = params;
  const w = spanCm / 100;
  const strip = fabricWidthCm / 100;
  const totalZ = strip * numberOfSwags;
  const anchorHeight = Math.max(3.1, sagCm / 100 + 1.65);
  const geom = useMemo(() => createCeilingSwagGeometry(spanCm, sagCm, fabricWidthCm, anchorHeight), [spanCm, sagCm, fabricWidthCm, anchorHeight]);
  useEffect(() => () => geom.dispose(), [geom]);
  const strips = useMemo(() => Array.from({ length: numberOfSwags }, (_, index) => index), [numberOfSwags]);
  const beamZ = totalZ / 2 + 0.12;
  return (
    <group>
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <boxGeometry args={[w + 0.5, 0.05, totalZ + 0.7]} />
        <meshStandardMaterial color="#e5ebf3" roughness={0.92} />
      </mesh>
      {strips.map((i) => (
        <group key={i} position={[0, 0, -totalZ / 2 + strip * (i + 0.5)]}>
          <Cloth geometry={geom} color={color} />
        </group>
      ))}
      <Bar from={[-w / 2, anchorHeight + 0.035, -beamZ]} to={[-w / 2, anchorHeight + 0.035, beamZ]} radius={0.035} />
      <Bar from={[w / 2, anchorHeight + 0.035, -beamZ]} to={[w / 2, anchorHeight + 0.035, beamZ]} radius={0.035} />
      {[-w / 2, w / 2].flatMap((x) => [-beamZ, beamZ].map((z) => (
        <Bar key={`${x}/${z}`} from={[x, 0.07, z]} to={[x, anchorHeight + 0.035, z]} radius={0.023} />
      ))}
      <Label3D position={[0, anchorHeight + 0.62, -beamZ]}>{w.toFixed(2)} ม. · ระยะจุดแขวน</Label3D>
      <Label3D position={[0, anchorHeight - sagCm / 100 - 0.35, totalZ / 2 + 0.3]}>หย่อน {(sagCm / 100).toFixed(2)} ม.</Label3D>
    </group>
  );
}

function CameraRig({ params, view, resetSignal }) {
  const { camera, invalidate } = useThree();
  const controlsRef = useRef();
  const kind = params.kind;
  const w = kind === 'backdrop' ? params.widthCm / 100 : params.spanCm / 100;
  const h = kind === 'backdrop' ? params.heightCm / 100 : Math.max(3.1, params.sagCm / 100 + 1.65);
  const d = kind === 'backdrop' ? 2 : (params.fabricWidthCm * params.numberOfSwags / 100);
  useEffect(() => {
    const distance = Math.max(5.6, Math.max(w, d) * 1.65, h * 2.1);
    const target = new THREE.Vector3(0, h * 0.50, 0);
    let point;
    if (view === 'front') point = new THREE.Vector3(0, h * 0.57, distance);
    else if (view === 'top') point = new THREE.Vector3(0.02, distance + h, 0.02);
    else point = new THREE.Vector3(distance * 0.31, h * 0.89, distance * 0.87);
    camera.position.copy(point);
    camera.near = 0.05;
    camera.far = Math.max(200, distance * 30);
    camera.updateProjectionMatrix();
    controlsRef.current?.target.copy(target);
    controlsRef.current?.update();
    invalidate();
  }, [camera, invalidate, view, resetSignal, kind, w, h, d]);
  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.085}
      minDistance={1.5}
      maxDistance={300}
      maxPolarAngle={Math.PI * 0.92}
      makeDefault
    />
  );
}

function StudioScene({ params, color, view, resetSignal }) {
  return (
    <>
      <color attach="background" args={['#edf2f9']} />
      <ambientLight intensity={1.30} />
      <hemisphereLight args={['#ffffff', '#a5b5ce', 1.5]} />
      <directionalLight castShadow position={[4, 8, 7]} intensity={2.2} shadow-mapSize={[1024, 1024]} shadow-bias={-0.00012} />
      <directionalLight position={[-5, 5, -3]} intensity={0.6} color="#dbe8ff" />
      <Grid position={[0, -0.005, 0]} args={[120, 120]} cellSize={1} cellThickness={0.6} cellColor="#dce5f0" sectionSize={5} sectionColor="#bdcde1" sectionThickness={0.8} fadeDistance={36} fadeStrength={1.5} infiniteGrid />
      {params.kind === 'backdrop' ? <BackdropModel params={params} color={color} /> : <CeilingModel params={params} color={color} />}
      <CameraRig params={params} view={view} resetSignal={resetSignal} />
    </>
  );
}

export default function FabricScene({ params, color = '#f4f7ff', view = 'perspective', resetSignal = 0 }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.7]}
      camera={{ position: [3, 4, 8], fov: 47, near: 0.05, far: 250 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      fallback={<div className="scene-fallback">เบราว์เซอร์นี้ไม่รองรับ WebGL กรุณาเปิดด้วย Chrome หรือ Safari เวอร์ชันล่าสุด</div>}
    >
      <Suspense fallback={null}>
        <StudioScene params={params} color={color} view={view} resetSignal={resetSignal} />
      </Suspense>
    </Canvas>
  );
}
