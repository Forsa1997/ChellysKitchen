import { describe, expect, it } from 'vitest';
import { festivalPositions } from './festivalLayout';

describe('festivalPositions', () => {
  it('returns one spot per truck', () => {
    expect(festivalPositions(1)).toHaveLength(1);
    expect(festivalPositions(8)).toHaveLength(8);
    expect(festivalPositions(48)).toHaveLength(48);
  });

  it('is deterministic', () => {
    expect(festivalPositions(12)).toEqual(festivalPositions(12));
  });

  it('keeps trucks far enough apart', () => {
    for (const count of [2, 8, 16, 32, 48]) {
      const spots = festivalPositions(count);
      for (let a = 0; a < spots.length; a += 1) {
        for (let b = a + 1; b < spots.length; b += 1) {
          const distance = Math.hypot(spots[a].x - spots[b].x, spots[a].z - spots[b].z);
          expect(distance).toBeGreaterThanOrEqual(2.6);
        }
      }
    }
  });

  it('turns every serving window toward the plaza center', () => {
    for (const spot of festivalPositions(14)) {
      const forward = { x: Math.sin(spot.rotationY), z: Math.cos(spot.rotationY) };
      const toCenter = Math.hypot(spot.x, spot.z);
      const dot = (forward.x * -spot.x + forward.z * -spot.z) / toCenter;
      expect(dot).toBeCloseTo(1, 5);
    }
  });

  it('leaves the festival entrance at the camera side open', () => {
    for (const spot of festivalPositions(20)) {
      expect(spot.z).toBeLessThanOrEqual(0.5);
    }
  });
});
