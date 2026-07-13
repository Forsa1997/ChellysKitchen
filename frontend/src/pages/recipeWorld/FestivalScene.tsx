import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import type { Group } from 'three';

/** Festival backdrop for the Rezeptwelt: plaza, bunting, ferris wheel, tents, trees, balloons. */

const flagColors = ['#e87a93', '#e6a73a', '#6aa986', '#6d9dcc', '#9a7abb', '#d94f3d'];

function BuntingString({ angle }: { angle: number }) {
  const flags = useMemo(() => {
    const from = { x: 0, y: 4.1 };
    const toX = Math.sin(angle) * 6.2;
    const toZ = Math.cos(angle) * 6.2;
    return Array.from({ length: 7 }, (_, i) => {
      const t = (i + 1) / 8;
      const sag = Math.sin(t * Math.PI) * 0.55;
      return {
        position: [from.x + toX * t, from.y - (from.y - 2.3) * t - sag, toZ * t] as const,
        color: flagColors[(i + Math.round(angle * 3)) % flagColors.length],
      };
    });
  }, [angle]);

  return (
    <group>
      {flags.map((flag, i) => (
        <mesh key={i} position={[...flag.position]} rotation={[Math.PI, angle, 0]}>
          <coneGeometry args={[0.1, 0.22, 3]} />
          <meshStandardMaterial color={flag.color} roughness={0.6} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Maypole() {
  return (
    <group>
      <mesh position={[0, 2.1, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 4.2, 10]} />
        <meshStandardMaterial color="#f2ead8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 4.25, 0]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial color="#e6a73a" emissive="#e6a73a" emissiveIntensity={0.4} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <BuntingString key={i} angle={(i / 8) * Math.PI * 2 + 0.2} />
      ))}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2 + 0.2;
        return (
          <mesh key={`anchor-${i}`} position={[Math.sin(angle) * 6.2, 1.15, Math.cos(angle) * 6.2]}>
            <cylinderGeometry args={[0.035, 0.05, 2.3, 8]} />
            <meshStandardMaterial color="#8a6a4f" roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

function FerrisWheel({ position, darkMode }: { position: [number, number, number]; darkMode: boolean }) {
  const wheel = useRef<Group>(null);
  useFrame((_, delta) => {
    if (wheel.current) wheel.current.rotation.z += delta * 0.12;
  });
  const gondolaColors = ['#e87a93', '#e6a73a', '#6aa986', '#6d9dcc', '#9a7abb', '#d94f3d', '#f4d03f', '#8fc177'];

  return (
    <group position={position} rotation={[0, 0.5, 0]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.5, 1.9, 0]} rotation={[0, 0, side * 0.28]} castShadow>
          <cylinderGeometry args={[0.09, 0.12, 3.9, 8]} />
          <meshStandardMaterial color="#8f6f52" roughness={0.6} />
        </mesh>
      ))}
      <group ref={wheel} position={[0, 3.7, 0]}>
        <mesh>
          <torusGeometry args={[2.7, 0.07, 8, 36]} />
          <meshStandardMaterial color="#f2ead8" roughness={0.5} emissive={darkMode ? '#ffb84d' : '#000000'} emissiveIntensity={darkMode ? 0.35 : 0} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={`spoke-${i}`} rotation={[0, 0, (i / 8) * Math.PI * 2]}>
            <boxGeometry args={[0.05, 5.35, 0.05]} />
            <meshStandardMaterial color="#c9b8a0" roughness={0.55} />
          </mesh>
        ))}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
          return (
            <mesh key={`gondola-${i}`} position={[Math.cos(angle) * 2.7, Math.sin(angle) * 2.7, 0]}>
              <sphereGeometry args={[0.3, 12, 10]} />
              <meshStandardMaterial color={gondolaColors[i]} roughness={0.5} emissive={darkMode ? gondolaColors[i] : '#000000'} emissiveIntensity={darkMode ? 0.25 : 0} />
            </mesh>
          );
        })}
      </group>
      <mesh position={[0, 3.7, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#e6a73a" roughness={0.4} />
      </mesh>
    </group>
  );
}

function Tent({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <coneGeometry args={[1.7, 1.9, 8]} />
        <meshStandardMaterial color={color} roughness={0.65} flatShading />
      </mesh>
      <mesh position={[0, 1.95, 0]}>
        <coneGeometry args={[0.55, 0.7, 8]} />
        <meshStandardMaterial color="#fbf4e8" roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0.12, 2.42, 0]} rotation={[0, 0, -0.25]}>
        <coneGeometry args={[0.09, 0.22, 3]} />
        <meshStandardMaterial color="#d94f3d" flatShading />
      </mesh>
    </group>
  );
}

function Tree({ position, height }: { position: [number, number, number]; height: number }) {
  return (
    <group position={position}>
      <mesh position={[0, height * 0.2, 0]}>
        <cylinderGeometry args={[0.09, 0.13, height * 0.4, 8]} />
        <meshStandardMaterial color="#6b4a35" roughness={0.8} />
      </mesh>
      <mesh position={[0, height * 0.65, 0]} castShadow>
        <coneGeometry args={[height * 0.32, height * 0.85, 8]} />
        <meshStandardMaterial color="#4e7a44" roughness={0.75} flatShading />
      </mesh>
    </group>
  );
}

function Balloon({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <Float speed={1.6} rotationIntensity={0.1} floatIntensity={0.9}>
      <group position={position}>
        <mesh castShadow>
          <sphereGeometry args={[0.32, 14, 12]} />
          <meshStandardMaterial color={color} roughness={0.35} />
        </mesh>
        <mesh position={[0, -0.62, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.65, 4]} />
          <meshStandardMaterial color="#f2ead8" />
        </mesh>
      </group>
    </Float>
  );
}

export function FestivalScene({ darkMode }: { darkMode: boolean }) {
  return (
    <group>
      {/* Grass and gravel plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[30, 56]} />
        <meshStandardMaterial color={darkMode ? '#274134' : '#a9d3a2'} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[6.4, 40]} />
        <meshStandardMaterial color={darkMode ? '#4a4238' : '#e3d3ae'} roughness={0.9} />
      </mesh>

      <Maypole />
      <FerrisWheel position={[-11.5, 0, -10]} darkMode={darkMode} />

      <Tent position={[10.5, 0, -8.5]} color="#e87a93" />
      <Tent position={[13.5, 0, -3.5]} color="#6d9dcc" />
      <Tent position={[-13.5, 0, -2.5]} color="#e6a73a" />

      {[
        [16.5, -8, 2.6], [-16, -9, 3.1], [7.5, -14.5, 2.4], [-6, -16, 3.0],
        [18, 1, 2.7], [-18, 3, 2.5], [13, 8, 2.9], [-12, 9, 2.4],
      ].map(([x, z, height], i) => (
        <Tree key={i} position={[x, 0, z]} height={height} />
      ))}

      <Balloon position={[4.5, 4.6, -3]} color="#e87a93" />
      <Balloon position={[-5.5, 5.2, -4.5]} color="#6d9dcc" />
      <Balloon position={[1.5, 5.6, -8]} color="#f4d03f" />

      {/* Moon at night, sun by day */}
      <mesh position={darkMode ? [12, 11, -16] : [14, 13, -18]}>
        <sphereGeometry args={[darkMode ? 0.9 : 1.2, 20, 20]} />
        <meshStandardMaterial
          color={darkMode ? '#f5efd8' : '#ffd98a'}
          emissive={darkMode ? '#f5efd8' : '#ffcf6b'}
          emissiveIntensity={darkMode ? 0.9 : 0.7}
        />
      </mesh>
    </group>
  );
}
