import type { DishKind } from './dishKind';

/** Deterministic body style and color palette for a recipe's food truck. */

export interface TruckPalette {
  body: string;
  accent: string;
  awning: string;
}

const palettes: Record<DishKind, TruckPalette[]> = {
  pasta: [
    { body: '#e9d8b8', accent: '#b03a2e', awning: '#b03a2e' },
    { body: '#c94f3d', accent: '#f2e3c9', awning: '#6da85e' },
  ],
  soup: [
    { body: '#d96c4f', accent: '#f7e6d0', awning: '#e0a13e' },
    { body: '#6d9dcc', accent: '#f2ead8', awning: '#d96c4f' },
  ],
  pizza: [
    { body: '#b03a2e', accent: '#f2e3c9', awning: '#6da85e' },
    { body: '#f2e3c9', accent: '#b03a2e', awning: '#b03a2e' },
  ],
  cake: [
    { body: '#e9a0b4', accent: '#fbf4e8', awning: '#e87a93' },
    { body: '#9a7abb', accent: '#f7e6d0', awning: '#e9a0b4' },
  ],
  burger: [
    { body: '#e6a73a', accent: '#6b3a2a', awning: '#b03a2e' },
    { body: '#6b3a2a', accent: '#f2c14e', awning: '#e6a73a' },
  ],
  salad: [
    { body: '#8fc177', accent: '#f2ead8', awning: '#5c9450' },
    { body: '#f2ead8', accent: '#6da85e', awning: '#8fc177' },
  ],
  fish: [
    { body: '#6d9dcc', accent: '#f2ead8', awning: '#41628a' },
    { body: '#41628a', accent: '#a8c6e3', awning: '#6d9dcc' },
  ],
  meat: [
    { body: '#8c4a32', accent: '#f2c14e', awning: '#5f3222' },
    { body: '#5f3222', accent: '#e0a13e', awning: '#8c4a32' },
  ],
  bread: [
    { body: '#c98a3d', accent: '#f7e6d0', awning: '#8a6a4f' },
    { body: '#f0d9a8', accent: '#8a6a4f', awning: '#c98a3d' },
  ],
  drink: [
    { body: '#6aa986', accent: '#f4d03f', awning: '#e87a93' },
    { body: '#e87a93', accent: '#fbf4e8', awning: '#6aa986' },
  ],
  fries: [
    { body: '#d94f3d', accent: '#f2c14e', awning: '#fbf4e8' },
    { body: '#f2c14e', accent: '#d94f3d', awning: '#d94f3d' },
  ],
  taco: [
    { body: '#e0a13e', accent: '#7bb661', awning: '#d94f3d' },
    { body: '#d94f3d', accent: '#e8b45a', awning: '#e0a13e' },
  ],
  casserole: [
    { body: '#a15c3e', accent: '#f6d365', awning: '#b03a2e' },
    { body: '#e8b45a', accent: '#8e2f24', awning: '#a15c3e' },
  ],
  pot: [
    { body: '#5d6b7a', accent: '#f2ead8', awning: '#e0a13e' },
    { body: '#7d8a99', accent: '#2f3742', awning: '#6aa986' },
  ],
};

type TruckStyle = 'van' | 'trailer' | 'cart';

export function truckStyleFor(seed: number): TruckStyle {
  const styles: TruckStyle[] = ['van', 'trailer', 'cart'];
  return styles[Math.floor(seed * styles.length) % styles.length];
}

export function truckPaletteFor(kind: DishKind, seed: number): TruckPalette {
  const options = palettes[kind];
  return options[Math.floor(seed * 10) % options.length];
}
