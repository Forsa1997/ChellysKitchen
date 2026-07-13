import type { DishKind } from './dishKind';

/**
 * Small procedural low-poly dishes for the Rezeptwelt stations.
 * Everything is built from three.js primitives so no models need to be
 * downloaded; each dish sits on y=0 and fits in roughly 1.4 world units.
 */

function pick<T>(seed: number, options: readonly T[]): T {
  return options[Math.floor(seed * options.length) % options.length];
}

function Plate() {
  return (
    <group>
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.72, 0.6, 0.06, 24]} />
        <meshStandardMaterial color="#fbf4e8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <torusGeometry args={[0.66, 0.03, 10, 28]} />
        <meshStandardMaterial color="#f1e4cf" roughness={0.45} />
      </mesh>
    </group>
  );
}

function Steam({ x = 0, y = 0.9 }: { x?: number; y?: number }) {
  return (
    <group>
      <mesh position={[x - 0.08, y, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.35} />
      </mesh>
      <mesh position={[x + 0.1, y + 0.16, 0.05]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function PastaDish({ seed }: { seed: number }) {
  const noodle = pick(seed, ['#f0c05a', '#f3cd73', '#eab84e']);
  return (
    <group>
      <Plate />
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[0, 0.14 + i * 0.045, 0]}
          rotation={[Math.PI / 2 + (i % 2 ? 0.18 : -0.14), 0, i * 0.7 + seed]}
        >
          <torusGeometry args={[0.34 - i * 0.035, 0.085, 10, 24]} />
          <meshStandardMaterial color={noodle} roughness={0.55} />
        </mesh>
      ))}
      {[[-0.16, 0.34, 0.1], [0.2, 0.36, -0.06], [0.02, 0.4, 0.22]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[0.11, 12, 12]} />
          <meshStandardMaterial color="#8a4a32" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[-0.05, 0.47, -0.12]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#5c9450" roughness={0.6} />
      </mesh>
    </group>
  );
}

function SoupDish({ seed }: { seed: number }) {
  const bowl = pick(seed, ['#d96c4f', '#6d9dcc', '#9a7abb']);
  const liquid = pick(seed, ['#c0392b', '#e0a13e', '#7bb661']);
  return (
    <group>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.35, 0.36, 20]} />
        <meshStandardMaterial color={bowl} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.365, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 0.02, 20]} />
        <meshStandardMaterial color={liquid} roughness={0.35} />
      </mesh>
      <mesh position={[0.32, 0.52, 0]} rotation={[0, 0, -0.9]}>
        <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
        <meshStandardMaterial color="#b9a684" roughness={0.5} />
      </mesh>
      <Steam y={0.62} />
    </group>
  );
}

function PizzaDish({ seed }: { seed: number }) {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.07, 24]} />
        <meshStandardMaterial color="#e8b45a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.64, 0.075, 10, 28]} />
        <meshStandardMaterial color="#c98a3d" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 0.03, 24]} />
        <meshStandardMaterial color="#f6d365" roughness={0.5} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2 + seed * 2;
        const r = 0.3 + (i % 2) * 0.13;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, 0.115, Math.sin(angle) * r]}>
            <cylinderGeometry args={[0.1, 0.1, 0.02, 14]} />
            <meshStandardMaterial color="#b03a2e" roughness={0.5} />
          </mesh>
        );
      })}
      {[[0.12, -0.32], [-0.35, 0.1], [0.3, 0.28]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.12, z]} rotation={[0, i, 0]}>
          <boxGeometry args={[0.1, 0.02, 0.07]} />
          <meshStandardMaterial color="#5c9450" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function CakeDish({ seed }: { seed: number }) {
  const sponge = pick(seed, ['#8b5a3c', '#e9a0b4', '#c98a3d']);
  return (
    <group>
      <Plate />
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.3, 24]} />
        <meshStandardMaterial color={sponge} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.43, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.52, 0.09, 24]} />
        <meshStandardMaterial color="#f7e6d0" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#c0392b" roughness={0.3} />
      </mesh>
      <mesh position={[0.04, 0.65, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.012, 0.012, 0.14, 6]} />
        <meshStandardMaterial color="#5c9450" />
      </mesh>
    </group>
  );
}

function BurgerDish() {
  return (
    <group>
      <Plate />
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.46, 0.14, 20]} />
        <meshStandardMaterial color="#e3a55d" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.53, 0.53, 0.11, 20]} />
        <meshStandardMaterial color="#6b3a2a" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.335, 0]} rotation={[0, 0.6, 0]}>
        <boxGeometry args={[0.92, 0.03, 0.92]} />
        <meshStandardMaterial color="#f4c542" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.38, 0]} scale={[1, 0.22, 1]}>
        <sphereGeometry args={[0.56, 16, 12]} />
        <meshStandardMaterial color="#7bb661" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.5, 0]} scale={[1, 0.66, 1]} castShadow>
        <sphereGeometry args={[0.5, 20, 14]} />
        <meshStandardMaterial color="#e3a55d" roughness={0.55} />
      </mesh>
      {[[-0.16, 0.06], [0.14, -0.1], [0.02, 0.2], [-0.22, -0.14], [0.24, 0.14]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.72, z]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#fbf4e8" />
        </mesh>
      ))}
    </group>
  );
}

function SaladDish({ seed }: { seed: number }) {
  const greens = ['#6da85e', '#8fc177', '#5c9450'];
  return (
    <group>
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.58, 0.38, 0.34, 20]} />
        <meshStandardMaterial color="#f2ead8" roughness={0.45} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2 + seed * 3;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.26, 0.4 + (i % 3) * 0.05, Math.sin(angle) * 0.26]}>
            <icosahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color={greens[i % greens.length]} roughness={0.55} flatShading />
          </mesh>
        );
      })}
      {[[-0.12, 0.5, 0.12], [0.18, 0.47, -0.08]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color="#d94f3d" roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function FishDish() {
  return (
    <group>
      <Plate />
      <group position={[0.05, 0.28, 0]} rotation={[0, -0.4, 0]}>
        <mesh scale={[1.15, 0.5, 0.45]} castShadow>
          <sphereGeometry args={[0.42, 18, 14]} />
          <meshStandardMaterial color="#7fa8c9" roughness={0.4} />
        </mesh>
        <mesh position={[-0.52, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.16, 0.28, 4]} />
          <meshStandardMaterial color="#6a92b3" roughness={0.4} flatShading />
        </mesh>
        <mesh position={[0.3, 0.06, 0.14]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#2c3540" />
        </mesh>
      </group>
      <mesh position={[-0.32, 0.11, 0.34]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.03, 16]} />
        <meshStandardMaterial color="#f4d03f" roughness={0.4} />
      </mesh>
    </group>
  );
}

function MeatDish() {
  return (
    <group>
      <Plate />
      <group position={[0.02, 0.28, 0]} rotation={[0, 0.5, 0.12]}>
        <mesh scale={[1.2, 0.85, 0.85]} castShadow>
          <sphereGeometry args={[0.3, 16, 12]} />
          <meshStandardMaterial color="#a15c3e" roughness={0.6} />
        </mesh>
        <mesh position={[0.42, 0.1, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.045, 0.045, 0.34, 10]} />
          <meshStandardMaterial color="#f5efe0" roughness={0.4} />
        </mesh>
        <mesh position={[0.56, 0.24, 0]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color="#f5efe0" roughness={0.4} />
        </mesh>
      </group>
      <mesh position={[-0.35, 0.12, -0.25]}>
        <icosahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial color="#6da85e" roughness={0.55} flatShading />
      </mesh>
    </group>
  );
}

function BreadDish() {
  return (
    <group>
      <mesh position={[0, 0.3, 0]} scale={[1.3, 0.72, 0.82]} castShadow>
        <sphereGeometry args={[0.45, 18, 14]} />
        <meshStandardMaterial color="#c98a3d" roughness={0.65} />
      </mesh>
      {[-0.22, 0, 0.22].map((x, i) => (
        <mesh key={i} position={[x, 0.56, 0]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.03, 0.05, 0.5]} />
          <meshStandardMaterial color="#f0d9a8" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function DrinkDish({ seed }: { seed: number }) {
  const juice = pick(seed, ['#e67e22', '#c0392b', '#8fc177']);
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.2, 0.5, 16]} />
        <meshStandardMaterial color={juice} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.29, 0.24, 0.66, 16, 1, true]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.25} roughness={0.1} />
      </mesh>
      <mesh position={[0.12, 0.62, 0]} rotation={[0, 0, -0.35]}>
        <cylinderGeometry args={[0.028, 0.028, 0.6, 8]} />
        <meshStandardMaterial color="#e05d7c" roughness={0.4} />
      </mesh>
      <mesh position={[-0.24, 0.66, 0]} rotation={[0.4, 0, 0.9]}>
        <cylinderGeometry args={[0.11, 0.11, 0.025, 14]} />
        <meshStandardMaterial color="#f4d03f" roughness={0.4} />
      </mesh>
    </group>
  );
}

function PotDish() {
  return (
    <group>
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.46, 0.44, 20]} />
        <meshStandardMaterial color="#5d6b7a" roughness={0.4} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.5, 0]} scale={[1, 0.4, 1]}>
        <sphereGeometry args={[0.5, 20, 12]} />
        <meshStandardMaterial color="#4c5866" roughness={0.4} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#2f3742" roughness={0.4} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.54, 0.34, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.2]} />
          <meshStandardMaterial color="#2f3742" roughness={0.4} />
        </mesh>
      ))}
      <Steam x={0.2} y={0.9} />
    </group>
  );
}

const dishComponents: Record<DishKind, (props: { seed: number }) => React.JSX.Element> = {
  pasta: PastaDish,
  soup: SoupDish,
  pizza: PizzaDish,
  cake: CakeDish,
  burger: BurgerDish,
  salad: SaladDish,
  fish: FishDish,
  meat: MeatDish,
  bread: BreadDish,
  drink: DrinkDish,
  pot: PotDish,
};

export function DishModel({ kind, seed }: { kind: DishKind; seed: number }) {
  const Dish = dishComponents[kind];
  return (
    <group rotation={[0, seed * Math.PI * 2, 0]}>
      <Dish seed={seed} />
    </group>
  );
}
