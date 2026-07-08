import { useId } from 'react';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

interface SitemarkIconProps {
  sx?: SxProps<Theme>;
}

export default function SitemarkIcon({ sx }: SitemarkIconProps) {
  const titleId = useId();

  return (
    <Box
      component="svg"
      role="img"
      aria-labelledby={titleId}
      viewBox="0 0 560 150"
      sx={[
        {
          display: 'block',
          width: { xs: 178, sm: 220 },
          height: 'auto',
          color: 'primary.main',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id={titleId}>Chellys Kitchen Logo</title>
      <defs>
        <linearGradient id="chellys-logo-plate" x1="42" y1="112" x2="172" y2="112" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7B5C8" />
          <stop offset="1" stopColor="#F8D9A9" />
        </linearGradient>
        <linearGradient id="chellys-logo-cloche" x1="64" y1="48" x2="154" y2="112" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE7CF" />
          <stop offset="0.55" stopColor="#F7AFC4" />
          <stop offset="1" stopColor="#D96C8B" />
        </linearGradient>
      </defs>

      <g aria-hidden="true">
        <ellipse cx="108" cy="116" rx="76" ry="18" fill="#FFF4EC" />
        <path
          data-testid="logo-cloche"
          d="M60 104c3-32 23-55 49-55s46 23 49 55H60Z"
          fill="url(#chellys-logo-cloche)"
        />
        <path d="M50 106h118c6 0 11 4 11 10s-5 10-11 10H50c-6 0-11-4-11-10s5-10 11-10Z" fill="url(#chellys-logo-plate)" />
        <path d="M85 49c5-9 13-14 24-14s19 5 24 14" fill="none" stroke="#C95C7B" strokeWidth="8" strokeLinecap="round" />
        <path
          data-testid="logo-heart-steam"
          d="M108 29c-10-11-29-5-29 11 0 17 29 31 29 31s29-14 29-31c0-16-19-22-29-11Z"
          fill="#E85F8C"
        />
        <path d="M98 84c8-8 16-8 24 0" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" opacity="0.88" />
        <circle cx="73" cy="117" r="4" fill="#D96C8B" opacity="0.7" />
        <circle cx="145" cy="117" r="4" fill="#D96C8B" opacity="0.7" />
      </g>

      <text
        x="202"
        y="76"
        fill="#C95C7B"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="54"
        fontWeight="700"
        letterSpacing="0.5"
      >
        Chellys
      </text>
      <text
        x="205"
        y="116"
        fill="#8A5A44"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="28"
        fontWeight="700"
        letterSpacing="8"
      >
        KITCHEN
      </text>
      <path d="M206 128h246" stroke="#F1B56F" strokeWidth="5" strokeLinecap="round" />
    </Box>
  );
}
