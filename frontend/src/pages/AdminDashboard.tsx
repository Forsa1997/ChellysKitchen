// Admin Dashboard Page
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
  InputLabel,
  LinearProgress,
  Snackbar,
  TextField,
} from '@mui/material';
import { useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useUsers, useUpdateUserRole, useUpdateUserName, useCreateUser, useAdminRecipes } from '../hooks/useAdmin';
import { useBatchImportJobs } from '../hooks/useBatchImport';
import { usePublishRecipe, useArchiveRecipe, useDeleteRecipe } from '../hooks/useRecipes';
import { useAuth } from '../auth/AuthContext';
import { apiClient, type User, type UserRole, type Recipe } from '../api/client';

type UserWithCounts = User & {
  _count?: {
    recipesCreated?: number;
  };
};

export function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const { data: usersData, isLoading, error } = useUsers();
  const { data: recipesData } = useAdminRecipes();
  const updateUserRole = useUpdateUserRole();
  const updateUserName = useUpdateUserName();
  const createUser = useCreateUser();
  const publishRecipe = usePublishRecipe();
  const archiveRecipe = useArchiveRecipe();
  const deleteRecipe = useDeleteRecipe();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('MEMBER');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'MEMBER' as UserRole });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<unknown | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const { data: batchJobsData } = useBatchImportJobs(currentUser?.role === 'ADMIN');

  const users = usersData?.data || [];
  const recipes = recipesData?.data || [];
  const batchJobs = batchJobsData?.data || [];
  const latestBatchJob = batchJobs[0];

  const handleRoleChange = (userId: string, currentRole: string) => {
    if (currentUser?.role !== 'ADMIN') {
      return;
    }

    setSelectedUser(userId);
    setNewRole(currentRole as UserRole);
    setRoleDialogOpen(true);
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;

    try {
      await updateUserRole.mutateAsync({
        id: selectedUser,
        data: { role: newRole },
      });
      setRoleDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Rolle konnte nicht geändert werden.');
    }
  };

  const handleNameChange = (user: User) => {
    setSelectedUser(user.id);
    setNewName(user.name);
    setNameDialogOpen(true);
  };

  const handleNameUpdate = async () => {
    if (!selectedUser || !newName.trim()) return;

    try {
      const updated = await updateUserName.mutateAsync({
        id: selectedUser,
        data: { name: newName.trim() },
      });
      setNameDialogOpen(false);
      setSelectedUser(null);
      setActionSuccess(`Name von ${updated.name} wurde geändert.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Name konnte nicht geändert werden.');
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password) {
      return;
    }

    try {
      const created = await createUser.mutateAsync({
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        role: newUser.role,
      });
      setCreateDialogOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'MEMBER' });
      setActionSuccess(`Benutzer ${created.name} wurde angelegt.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Benutzer konnte nicht angelegt werden.');
    }
  };

  const handleRecipeAction = async (action: () => Promise<unknown>, failureMessage: string) => {
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : failureMessage);
    }
  };

  const handleExportBackup = async () => {
    setBackupBusy(true);
    try {
      const payload = await apiClient.exportBackup();
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chellys-kitchen-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Backup konnte nicht erstellt werden.');
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImportFileSelected = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPendingImport(JSON.parse(await file.text()));
    } catch {
      setActionError('Die Datei ist kein gültiges Backup (JSON erwartet).');
    } finally {
      // Allow re-selecting the same file after a cancelled or failed import.
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const handleImportConfirm = async () => {
    if (pendingImport === null) return;
    setBackupBusy(true);
    try {
      const result = await apiClient.importBackup(pendingImport);
      setPendingImport(null);
      setActionSuccess(
        `Backup eingespielt: ${result.recipes} Rezepte, ${result.users} Benutzer, ${result.categories} Kategorien, ${result.uploads} Bilder.`,
      );
      queryClient.invalidateQueries();
    } catch (err) {
      const message = (err as { message?: string })?.message;
      setActionError(message || 'Backup konnte nicht eingespielt werden.');
    } finally {
      setBackupBusy(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'EDITOR':
        return 'warning';
      case 'MEMBER':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleNewRoleChange = (event: SelectChangeEvent<UserRole>) => {
    setNewRole(event.target.value as UserRole);
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <Alert severity="error">
        Du hast keine Berechtigung, auf das Admin Dashboard zuzugreifen.
      </Alert>
    );
  }

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error instanceof Error ? error.message : 'Fehler beim Laden der Benutzer'}</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Admin Dashboard
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Lege Benutzer an und verwalte ihre Rollen — eine öffentliche Registrierung gibt es nicht.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setCreateDialogOpen(true)} sx={{ flexShrink: 0 }}>
          Benutzer anlegen
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>E-Mail</TableCell>
              <TableCell>Rolle</TableCell>
              <TableCell>Erstellt am</TableCell>
              <TableCell>Rezepte</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user: UserWithCounts) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={user.role} color={getRoleColor(user.role)} size="small" />
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString('de-DE')}
                </TableCell>
                <TableCell>
                  {user._count?.recipesCreated || 0}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleNameChange(user)}
                      disabled={updateUserName.isPending}
                    >
                      Name ändern
                    </Button>
                    {user.id !== currentUser?.id && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleRoleChange(user.id, user.role)}
                        disabled={updateUserRole.isPending}
                      >
                        Rolle ändern
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Rezepte moderieren
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Veröffentliche, archiviere oder lösche Rezepte.
        </Typography>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell>Titel</TableCell>
              <TableCell>Kategorie</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Autor</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recipes.map((recipe: Recipe) => (
              <TableRow key={recipe.id}>
                <TableCell>
                  <Button component={RouterLink} to={`/recipes/${recipe.slug}`} size="small" sx={{ textTransform: 'none' }}>
                    {recipe.title}
                  </Button>
                </TableCell>
                <TableCell>{recipe.category}</TableCell>
                <TableCell>
                  <Chip
                    label={recipe.status}
                    size="small"
                    color={recipe.status === 'PUBLISHED' ? 'success' : recipe.status === 'ARCHIVED' ? 'warning' : 'default'}
                  />
                </TableCell>
                <TableCell>{recipe.createdBy?.name}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    <Button
                      component={RouterLink}
                      to={`/recipes/${recipe.slug}/edit`}
                      size="small"
                      variant="outlined"
                    >
                      Bearbeiten
                    </Button>
                    {recipe.status !== 'PUBLISHED' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        disabled={publishRecipe.isPending}
                        onClick={() => handleRecipeAction(() => publishRecipe.mutateAsync(recipe.id), 'Veröffentlichen fehlgeschlagen.')}
                      >
                        Veröffentlichen
                      </Button>
                    )}
                    {recipe.status !== 'ARCHIVED' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        disabled={archiveRecipe.isPending}
                        onClick={() => handleRecipeAction(() => archiveRecipe.mutateAsync(recipe.id), 'Archivieren fehlgeschlagen.')}
                      >
                        Archivieren
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={deleteRecipe.isPending}
                      onClick={() => {
                        if (window.confirm(`"${recipe.title}" wirklich löschen?`)) {
                          handleRecipeAction(() => deleteRecipe.mutateAsync(recipe.id), 'Löschen fehlgeschlagen.');
                        }
                      }}
                    >
                      Löschen
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Batch-Foto-Import
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Lade viele Rezeptfotos auf einmal hoch — jedes erkannte Rezept wird als
          unveröffentlichter Entwurf mit dem Tag „KI-Import“ angelegt und wartet
          oben in der Moderationsliste auf seine Freigabe.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={1.5}>
          {latestBatchJob && (
            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
                <Chip
                  size="small"
                  label={latestBatchJob.status === 'RUNNING' ? 'Läuft…' : 'Abgeschlossen'}
                  color={latestBatchJob.status === 'RUNNING' ? 'info' : 'success'}
                />
                <Typography variant="body2" color="text.secondary">
                  Letzter Batch ({new Date(latestBatchJob.createdAt).toLocaleString('de-DE')}):{' '}
                  {latestBatchJob.processed}/{latestBatchJob.total} Fotos verarbeitet,{' '}
                  {latestBatchJob.created} Entwürfe erstellt
                  {latestBatchJob.failed > 0 ? `, ${latestBatchJob.failed} fehlgeschlagen` : ''}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={latestBatchJob.total > 0 ? (latestBatchJob.processed / latestBatchJob.total) * 100 : 0}
                aria-label="Fortschritt des letzten Batch-Imports"
                sx={{ mt: 1 }}
              />
            </Box>
          )}
          <Box>
            <Button variant="contained" component={RouterLink} to="/admin/batch-import">
              Batch-Import öffnen
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Backup
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Lade regelmäßig ein Backup als zusätzliche Absicherung herunter. Es schützt vor
          versehentlichem Löschen und erleichtert einen Umzug; die Produktionsdatenbank bleibt
          bei normalen Redeploys erhalten.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button variant="contained" onClick={handleExportBackup} disabled={backupBusy}>
            Backup herunterladen
          </Button>
          <Button variant="outlined" component="label" disabled={backupBusy}>
            Backup einspielen
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              aria-label="Backup-Datei auswählen"
              onChange={(event) => handleImportFileSelected(event.target.files?.[0])}
            />
          </Button>
        </Stack>
      </Paper>

      <Dialog open={pendingImport !== null} onClose={() => setPendingImport(null)}>
        <DialogTitle>Backup einspielen?</DialogTitle>
        <DialogContent>
          <Typography>
            Alle aktuellen Rezepte, Benutzer, Bewertungen und Kategorien werden durch den
            Stand aus dem Backup ersetzt. Dieser Schritt kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingImport(null)}>Abbrechen</Button>
          <Button onClick={handleImportConfirm} variant="contained" color="error" disabled={backupBusy}>
            Importieren
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Benutzer anlegen</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              required
              value={newUser.name}
              onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))}
              autoComplete="off"
            />
            <TextField
              label="E-Mail"
              type="email"
              required
              value={newUser.email}
              onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
              autoComplete="off"
            />
            <TextField
              label="Passwort"
              type="password"
              required
              value={newUser.password}
              onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))}
              autoComplete="new-password"
            />
            <FormControl fullWidth>
              <InputLabel id="create-role-select-label">Rolle</InputLabel>
              <Select
                labelId="create-role-select-label"
                label="Rolle"
                value={newUser.role}
                onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value as UserRole }))}
              >
                <MenuItem value="GUEST">Gast</MenuItem>
                <MenuItem value="MEMBER">Mitglied</MenuItem>
                <MenuItem value="EDITOR">Editor</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleCreateUser} variant="contained" disabled={createUser.isPending}>
            Anlegen
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>Benutzerrolle ändern</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="role-select-label">Neue Rolle</InputLabel>
            <Select
              labelId="role-select-label"
              label="Neue Rolle"
              value={newRole}
              onChange={handleNewRoleChange}
            >
              <MenuItem value="GUEST">Gast</MenuItem>
              <MenuItem value="MEMBER">Mitglied</MenuItem>
              <MenuItem value="EDITOR">Editor</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleRoleUpdate} variant="contained" disabled={updateUserRole.isPending}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={nameDialogOpen} onClose={() => setNameDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Namen ändern</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            margin="dense"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNameDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleNameUpdate} variant="contained" disabled={updateUserName.isPending || !newName.trim()}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={actionError !== null}
        autoHideDuration={4000}
        onClose={() => setActionError(null)}
      >
        <Alert severity="error" onClose={() => setActionError(null)} sx={{ width: '100%' }}>
          {actionError}
        </Alert>
      </Snackbar>

      <Snackbar
        open={actionSuccess !== null}
        autoHideDuration={6000}
        onClose={() => setActionSuccess(null)}
      >
        <Alert severity="success" onClose={() => setActionSuccess(null)} sx={{ width: '100%' }}>
          {actionSuccess}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
