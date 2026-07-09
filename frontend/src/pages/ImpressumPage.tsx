import { Alert, Box, Link, Stack, Typography } from '@mui/material';
import { siteOperator, operatorNeedsCompletion } from '../legal/siteOperator';

export function ImpressumPage() {
  const op = siteOperator;
  const incomplete = operatorNeedsCompletion();

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Impressum
      </Typography>

      {incomplete && (
        <Alert severity="warning">
          Die Betreiberangaben sind noch nicht vollständig ausgefüllt. Bitte die Datei
          <code> frontend/src/legal/siteOperator.ts </code> mit den echten Kontaktdaten
          ergänzen.
        </Alert>
      )}

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Angaben gemäß § 5 DDG
        </Typography>
        <Typography>{op.name}</Typography>
        <Typography>{op.street}</Typography>
        <Typography>
          {op.postalCode} {op.city}
        </Typography>
        <Typography>{op.country}</Typography>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Kontakt
        </Typography>
        {op.phone && <Typography>Telefon: {op.phone}</Typography>}
        <Typography>
          E-Mail: <Link href={`mailto:${op.email}`}>{op.email}</Link>
        </Typography>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Verantwortlich für den Inhalt
        </Typography>
        <Typography>
          {op.name}, {op.street}, {op.postalCode} {op.city}
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary">
        Chellys Kitchen ist eine private, werbefreie Familien-Rezeptsammlung. Es werden
        keine kommerziellen Zwecke verfolgt.
      </Typography>
    </Stack>
  );
}
