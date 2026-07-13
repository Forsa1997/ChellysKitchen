export interface TruckSpot {
  x: number;
  z: number;
  /** Facing angle so the serving window (+z of the truck) points to the plaza center. */
  rotationY: number;
}

// Trucks stand in concentric arcs around the plaza. The arc stays open toward
// the camera (positive z) so the first view looks into the festival entrance.
const ARC_START = Math.PI * 0.56; // ~101°, measured from the +z axis
const ARC_END = Math.PI * 1.44; // ~259°
const FIRST_RADIUS = 7.2;
const RING_GAP = 3.6;
const TRUCK_SPACING = 3.1;

function ringCapacity(radius: number): number {
  return Math.max(1, Math.floor((radius * (ARC_END - ARC_START)) / TRUCK_SPACING));
}

export function festivalPositions(count: number): TruckSpot[] {
  const spots: TruckSpot[] = [];
  let remaining = count;
  let radius = FIRST_RADIUS;

  while (remaining > 0) {
    const inRing = Math.min(remaining, ringCapacity(radius));
    for (let i = 0; i < inRing; i += 1) {
      const t = inRing === 1 ? 0.5 : i / (inRing - 1);
      const angle = ARC_START + t * (ARC_END - ARC_START);
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      spots.push({ x, z, rotationY: Math.atan2(-x, -z) });
    }
    remaining -= inRing;
    radius += RING_GAP;
  }

  return spots;
}
