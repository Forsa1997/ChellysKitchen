export type Vec3 = [number, number, number];

/** Moves the camera along its viewing ray: factor < 1 zooms in, > 1 zooms out. */
export function zoomPosition(position: Vec3, target: Vec3, factor: number, minDistance: number, maxDistance: number): Vec3 {
  const dx = position[0] - target[0];
  const dy = position[1] - target[1];
  const dz = position[2] - target[2];
  const distance = Math.hypot(dx, dy, dz) || 1;
  const next = Math.min(maxDistance, Math.max(minDistance, distance * factor));
  const scale = next / distance;
  return [target[0] + dx * scale, target[1] + dy * scale, target[2] + dz * scale];
}

/** Rotates the camera around the target's vertical axis, keeping height and distance. */
export function orbitPosition(position: Vec3, target: Vec3, angle: number): Vec3 {
  const dx = position[0] - target[0];
  const dz = position[2] - target[2];
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [target[0] + dx * cos + dz * sin, position[1], target[2] - dx * sin + dz * cos];
}
