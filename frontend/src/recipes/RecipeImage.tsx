import { Box, CardMedia } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type { ElementType } from 'react';
import { useAuthedImageSrc } from './useAuthedImageSrc';

export interface RecipeImageProps {
  /** Raw image URL from the recipe. May be external, a bundled asset, or a
   *  protected `/uploads/…` photo — resolution is handled transparently. */
  src: string | null | undefined;
  alt?: string;
  sx?: SxProps<Theme>;
  /** Underlying element for CardMedia; defaults to a plain `<img>`. */
  component?: ElementType;
}

/**
 * Renders a recipe image while the app is private. Public URLs render straight
 * away; protected uploads are fetched with the bearer token and shown via an
 * object URL. A neutral placeholder fills the same box while a protected image
 * is still loading.
 */
export function RecipeImage({ src, alt, sx, component = 'img' }: RecipeImageProps) {
  const resolved = useAuthedImageSrc(src);

  if (!resolved) {
    return <Box aria-hidden sx={[{ bgcolor: 'action.hover' }, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>} />;
  }

  return <CardMedia component={component} image={resolved} alt={alt} sx={sx} />;
}
