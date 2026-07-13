import { describe, expect, it } from 'vitest';
import { orbitPosition, zoomPosition } from './cameraControls';

const target: [number, number, number] = [0, 1, 0];

function distance(a: readonly number[], b: readonly number[]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

describe('zoomPosition', () => {
  it('scales the camera distance by the factor', () => {
    const next = zoomPosition([0, 9, 16], target, 0.5, 2, 40);
    expect(distance(next, target)).toBeCloseTo(distance([0, 9, 16], target) * 0.5, 5);
  });

  it('clamps to the minimum and maximum distance', () => {
    const near = zoomPosition([0, 3, 4], target, 0.01, 5, 40);
    expect(distance(near, target)).toBeCloseTo(5, 5);
    const far = zoomPosition([0, 3, 4], target, 100, 5, 20);
    expect(distance(far, target)).toBeCloseTo(20, 5);
  });

  it('keeps the viewing direction', () => {
    const [x, y, z] = zoomPosition([0, 5, 8], target, 0.5, 1, 40);
    expect(x).toBeCloseTo(0, 5);
    expect((y - target[1]) / (z - target[2])).toBeCloseTo(4 / 8, 5);
  });
});

describe('orbitPosition', () => {
  it('keeps distance and height while rotating around the target', () => {
    const start: [number, number, number] = [3, 7, 10];
    const next = orbitPosition(start, target, 0.7);
    expect(next[1]).toBeCloseTo(7, 5);
    expect(distance(next, target)).toBeCloseTo(distance(start, target), 5);
  });

  it('returns to the start after a full turn', () => {
    const start: [number, number, number] = [3, 7, 10];
    const next = orbitPosition(start, target, Math.PI * 2);
    expect(next[0]).toBeCloseTo(3, 5);
    expect(next[2]).toBeCloseTo(10, 5);
  });

  it('rotates by the given angle', () => {
    const next = orbitPosition([0, 5, 10], target, Math.PI / 2);
    expect(next[0]).toBeCloseTo(10, 5);
    expect(next[2]).toBeCloseTo(0, 5);
  });
});
