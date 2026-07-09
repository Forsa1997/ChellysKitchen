import { Box, Link, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import { siteOperator } from '../legal/siteOperator';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export function DatenschutzPage() {
  const op = siteOperator;

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Datenschutzerklärung
      </Typography>

      <Typography color="text.secondary">
        Chellys Kitchen ist eine private Familien-Rezeptsammlung. Wir verarbeiten so wenige
        personenbezogene Daten wie möglich und geben keine Daten zu Werbezwecken weiter.
      </Typography>

      <Section title="Verantwortlicher">
        <Typography>
          {op.name}, {op.street}, {op.postalCode} {op.city}, {op.country}
        </Typography>
        <Typography>
          E-Mail: <Link href={`mailto:${op.email}`}>{op.email}</Link>
        </Typography>
      </Section>

      <Section title="Welche Daten wir verarbeiten">
        <List dense sx={{ listStyleType: 'disc', pl: 3 }}>
          <ListItem sx={{ display: 'list-item', px: 0 }}>
            <ListItemText primary="Konto: Name, E-Mail-Adresse und ein verschlüsselt (scrypt) gespeichertes Passwort. Konten werden ausschließlich durch die Administration angelegt — es gibt keine öffentliche Registrierung." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0 }}>
            <ListItemText primary="Inhalte: von dir angelegte Rezepte, Bewertungen, Favoriten, Notizen und Wochenpläne." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0 }}>
            <ListItemText primary="Anmeldung: kurzlebige Sitzungs-Token werden im Browser (localStorage) gespeichert, damit du angemeldet bleibst." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0 }}>
            <ListItemText primary="Server-Protokolle: beim Aufruf verarbeitet der Hoster technisch notwendige Daten (u. a. IP-Adresse) zur Auslieferung und Absicherung der Seite." />
          </ListItem>
        </List>
      </Section>

      <Section title="Zwecke und Rechtsgrundlage">
        <Typography>
          Die Verarbeitung dient dem Betrieb der Rezept-App für die Familie (Art. 6 Abs. 1
          lit. b und f DSGVO). Fehlgeschlagene Anmeldeversuche werden vorübergehend
          gezählt, um das Erraten von Passwörtern zu erschweren.
        </Typography>
      </Section>

      <Section title="Hosting">
        <Typography>
          Die Anwendung wird bei Render (Render Services, Inc.) in einem Rechenzentrum in
          Frankfurt am Main betrieben. Rezepte, Konten und hochgeladene Bilder liegen in
          einer PostgreSQL-Datenbank ebenfalls in Frankfurt.
        </Typography>
      </Section>

      <Section title="Weitergabe an Dritte">
        <Typography>
          Eine Weitergabe erfolgt nur, wenn du die Bring!-Funktion nutzt: Beim Export einer
          Einkaufsliste ruft der Dienst Bring! Labs AG eine öffentlich abrufbare Zutatenseite
          ab. Dabei werden nur die Zutaten des jeweiligen Rezepts bzw. Wochenplans
          übermittelt, keine Kontodaten.
        </Typography>
      </Section>

      <Section title="Speicherdauer">
        <Typography>
          Konto- und Inhaltsdaten bleiben gespeichert, bis das Konto oder der jeweilige
          Inhalt gelöscht wird. Sitzungs-Token laufen automatisch ab (Zugriff nach einem
          Tag, Verlängerung nach 30 Tagen).
        </Typography>
      </Section>

      <Section title="Deine Rechte">
        <Typography>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung, Datenübertragbarkeit und Widerspruch sowie ein Beschwerderecht bei
          einer Datenschutz-Aufsichtsbehörde. Wende dich dafür an{' '}
          <Link href={`mailto:${op.email}`}>{op.email}</Link>.
        </Typography>
      </Section>
    </Stack>
  );
}
