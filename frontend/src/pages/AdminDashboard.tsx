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
  Snackbar,
} from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { useUsers, useUpdateUserRole, useAdminRecipes } from '../hooks/useAdmin';
import { usePublishRecipe, useArchiveRecipe, useDeleteRecipe } from '../hooks/useRecipes';
import { useAuth } from '../auth/AuthContext';
import { type User, type UserRole, type Recipe } from '../api/client';

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
  const publishRecipe = usePublishRecipe();
  const archiveRecipe = useArchiveRecipe();
  const deleteRecipe = useDeleteRecipe();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('MEMBER');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const users = usersData?.data || [];
  const recipes = recipesData?.data || [];

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

  const handleRecipeAction = async (action: () => Promise<unknown>, failureMessage: string) => {
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : failureMessage);
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
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Admin Dashboard
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Verwalte Benutzerrollen und Berechtigungen.
        </Typography>
      </Box>

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

      <Snackbar
        open={actionError !== null}
        autoHideDuration={4000}
        onClose={() => setActionError(null)}
      >
        <Alert severity="error" onClose={() => setActionError(null)} sx={{ width: '100%' }}>
          {actionError}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
