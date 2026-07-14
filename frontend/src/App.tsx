import { lazy, Suspense } from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router';
import type {} from '@mui/material/themeCssVarsAugmentation';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from './AppTheme';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { QueryProvider } from './providers/QueryProvider';
import { AppShell } from './layout/AppShell';
import { CreateRecipePage } from './pages/CreateRecipePage';
import { EditRecipePage } from './pages/EditRecipePage';
import { HomePage } from './pages/HomePage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { SignInPage } from './pages/SignInPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { BatchImportPage } from './pages/BatchImportPage';
import { WeekPlanPage } from './pages/WeekPlanPage';

const RecipeWorldPage = lazy(() => import('./pages/RecipeWorldPage').then((module) => ({ default: module.RecipeWorldPage })));

function App() {
  const routerMode = import.meta.env.VITE_ROUTER_MODE ?? (import.meta.env.PROD ? 'hash' : 'browser');
  const RouterComponent = routerMode === 'hash' ? HashRouter : BrowserRouter;

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <QueryProvider>
        <AuthProvider>
          <RouterComponent>
            <AppShell>
              <Routes>
                <Route
                  path="/"
                  element={(
                    <RequireAuth>
                      <HomePage />
                    </RequireAuth>
                  )}
                />
                <Route
                  path="/rezeptwelt"
                  element={(
                    <RequireAuth>
                      <Suspense fallback={null}><RecipeWorldPage /></Suspense>
                    </RequireAuth>
                  )}
                />
                <Route
                  path="/recipes/:slug"
                  element={(
                    <RequireAuth>
                      <RecipeDetailPage />
                    </RequireAuth>
                  )}
                />
                <Route
                  path="/recipes/new"
                  element={(
                    <RequireAuth>
                      <CreateRecipePage />
                    </RequireAuth>
                  )}
                />
                <Route
                  path="/recipes/:slug/edit"
                  element={(
                    <RequireAuth>
                      <EditRecipePage />
                    </RequireAuth>
                  )}
                />
                <Route
                  path="/wochenplan"
                  element={(
                    <RequireAuth>
                      <WeekPlanPage />
                    </RequireAuth>
                  )}
                />
                <Route
                  path="/admin"
                  element={(
                    <RequireAuth>
                      <AdminDashboard />
                    </RequireAuth>
                  )}
                />
                <Route
                  path="/admin/batch-import"
                  element={(
                    <RequireAuth>
                      <BatchImportPage />
                    </RequireAuth>
                  )}
                />
                <Route path="/signin" element={<SignInPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </RouterComponent>
        </AuthProvider>
      </QueryProvider>
    </AppTheme>
  );
}

export default App;
