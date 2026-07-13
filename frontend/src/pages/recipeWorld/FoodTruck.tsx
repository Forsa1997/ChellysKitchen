import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { DishModel } from './DishModel';
import type { DishKind } from './dishKind';
import { truckPaletteFor, truckStyleFor, type TruckPalette } from './truckTheme';

/**
 * A festival food truck. The truck's length runs along the local x axis and
 * the serving window faces +z, so `festivalPositions` can point it at the
 * plaza. Body style and colors vary deterministically per recipe seed.
 */
function Wheel({ x, z, radius = 0.28 }: { x: number; z: number; radius?: number }) {
  return (
    <group position={[x, radius, z]} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, 0.14, 14]} />
        <meshStandardMaterial color="#2c2c34" roughness={0.7} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[radius * 0.45, radius * 0.45, 0.16, 10]} />
        <meshStandardMaterial color="#c9c9d1" roughness={0.35} metalness={0.4} />
      </mesh>
    </group>
  );
}

function Awning({ width, y, z, color }: { width: number; y: number; z: number; color: string }) {
  const stripes = Math.max(4, Math.round(width / 0.26));
  const stripeWidth = width / stripes;
  return (
    <group position={[0, y, z]} rotation={[-0.55, 0, 0]}>
      {Array.from({ length: stripes }, (_, i) => (
        <mesh key={i} position={[(i + 0.5) * stripeWidth - width / 2, 0, 0]}>
          <boxGeometry args={[stripeWidth, 0.03, 0.72]} />
          <meshStandardMaterial color={i % 2 ? '#fbf4e8' : color} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function ServingWindow({ width, y, z }: { width: number; y: number; z: number }) {
  return (
    <group>
      <mesh position={[0, y, z]}>
        <boxGeometry args={[width, 0.58, 0.05]} />
        <meshStandardMaterial color="#2a2230" roughness={0.3} />
      </mesh>
      <mesh position={[0, y - 0.36, z + 0.12]}>
        <boxGeometry args={[width + 0.2, 0.06, 0.28]} />
        <meshStandardMaterial color="#8a6a4f" roughness={0.6} />
      </mesh>
    </group>
  );
}

function RoofLights({ width, y, z }: { width: number; y: number; z: number }) {
  const count = 5;
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[(i / (count - 1) - 0.5) * width, y, z]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#ffd98a" emissive="#ffb84d" emissiveIntensity={1.6} />
        </mesh>
      ))}
    </group>
  );
}

function MenuBoard({ x, accent }: { x: number; accent: string }) {
  return (
    <group position={[x, 0, 1.1]} rotation={[0, -0.4, 0]}>
      <mesh position={[0, 0.42, 0]} rotation={[-0.16, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 0.7, 0.04]} />
        <meshStandardMaterial color="#3d3229" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, -0.01]} rotation={[-0.16, 0, 0]}>
        <boxGeometry args={[0.38, 0.4, 0.045]} />
        <meshStandardMaterial color={accent} roughness={0.6} />
      </mesh>
    </group>
  );
}

function RotatingDish({ kind, seed, y, scale = 0.8 }: { kind: DishKind; seed: number; y: number; scale?: number }) {
  const spinner = useRef<Group>(null);
  useFrame((_, delta) => {
    if (spinner.current) spinner.current.rotation.y += delta * 0.45;
  });
  return (
    <group position={[0, y, 0]} scale={scale}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.34, 0.38, 0.06, 14]} />
        <meshStandardMaterial color="#3d3229" roughness={0.6} />
      </mesh>
      <group ref={spinner} position={[0, 0.05, 0]}>
        <DishModel kind={kind} seed={seed} />
      </group>
    </group>
  );
}

function VanBody({ palette }: { palette: TruckPalette }) {
  return (
    <group>
      <mesh position={[0.3, 1.02, 0]} castShadow>
        <boxGeometry args={[2.1, 1.2, 1.15]} />
        <meshStandardMaterial color={palette.body} roughness={0.5} />
      </mesh>
      <mesh position={[-1.05, 0.86, 0]} castShadow>
        <boxGeometry args={[0.85, 0.88, 1.05]} />
        <meshStandardMaterial color={palette.body} roughness={0.5} />
      </mesh>
      <mesh position={[-1.32, 1.02, 0]}>
        <boxGeometry args={[0.3, 0.42, 0.95]} />
        <meshStandardMaterial color="#bcd7ea" roughness={0.2} metalness={0.2} />
      </mesh>
      <mesh position={[0.3, 1.66, 0]}>
        <boxGeometry args={[2.2, 0.09, 1.25]} />
        <meshStandardMaterial color={palette.accent} roughness={0.55} />
      </mesh>
      <Wheel x={-1.0} z={0.62} />
      <Wheel x={-1.0} z={-0.62} />
      <Wheel x={0.95} z={0.62} />
      <Wheel x={0.95} z={-0.62} />
      <ServingWindow width={1.35} y={1.14} z={0.6} />
      <Awning width={1.7} y={1.62} z={0.82} color={palette.awning} />
      <RoofLights width={2.0} y={1.72} z={0.58} />
    </group>
  );
}

function TrailerBody({ palette }: { palette: TruckPalette }) {
  return (
    <group>
      <mesh position={[0.15, 1.08, 0]} castShadow>
        <boxGeometry args={[2.0, 1.15, 1.15]} />
        <meshStandardMaterial color={palette.body} roughness={0.5} />
      </mesh>
      <mesh position={[0.15, 1.7, 0]} scale={[1, 0.45, 1]}>
        <cylinderGeometry args={[0.58, 0.58, 2.0, 14, 1, false]} />
        <meshStandardMaterial color={palette.accent} roughness={0.55} />
      </mesh>
      <mesh position={[-1.1, 0.62, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.05, 0.05, 0.75, 8]} />
        <meshStandardMaterial color="#3d3d46" roughness={0.5} />
      </mesh>
      <Wheel x={0.55} z={0.62} radius={0.24} />
      <Wheel x={0.55} z={-0.62} radius={0.24} />
      <Wheel x={-0.35} z={0.62} radius={0.24} />
      <Wheel x={-0.35} z={-0.62} radius={0.24} />
      <ServingWindow width={1.25} y={1.18} z={0.6} />
      <Awning width={1.6} y={1.68} z={0.82} color={palette.awning} />
      <RoofLights width={1.8} y={1.94} z={0.4} />
    </group>
  );
}

function CartBody({ palette }: { palette: TruckPalette }) {
  return (
    <group>
      <mesh position={[0, 0.92, 0]} castShadow>
        <boxGeometry args={[1.55, 0.95, 0.95]} />
        <meshStandardMaterial color={palette.body} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.42, 0.4]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[1.45, 0.5, 0.06]} />
        <meshStandardMaterial color="#8a6a4f" roughness={0.7} />
      </mesh>
      <Wheel x={-0.55} z={0} radius={0.34} />
      <Wheel x={0.55} z={0} radius={0.34} />
      <ServingWindow width={1.0} y={1.12} z={0.5} />
      <mesh position={[0, 2.05, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.5, 8]} />
        <meshStandardMaterial color="#8a6a4f" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.62, 0]} castShadow>
        <coneGeometry args={[1.15, 0.55, 10]} />
        <meshStandardMaterial color={palette.awning} roughness={0.6} flatShading />
      </mesh>
      <RoofLights width={1.4} y={1.44} z={0.5} />
    </group>
  );
}

export interface FoodTruckProps {
  kind: DishKind;
  seed: number;
  onSelect?: () => void;
}

export function FoodTruck({ kind, seed, onSelect }: FoodTruckProps) {
  const [hovered, setHovered] = useState(false);
  const palette = truckPaletteFor(kind, seed);
  const style = truckStyleFor(seed);

  return (
    <group
      scale={hovered ? 1.06 : 1}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {style === 'van' && <VanBody palette={palette} />}
      {style === 'trailer' && <TrailerBody palette={palette} />}
      {style === 'cart' && <CartBody palette={palette} />}
      <MenuBoard x={style === 'cart' ? 1.15 : 1.6} accent={palette.accent} />
      <RotatingDish
        kind={kind}
        seed={seed}
        y={style === 'van' ? 1.72 : style === 'trailer' ? 1.98 : 1.42}
        scale={style === 'cart' ? 0.62 : 0.85}
      />
    </group>
  );
}
