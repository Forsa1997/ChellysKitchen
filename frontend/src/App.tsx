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
import { WeekPlanPage } from './pages/WeekPlanPage';
import { ImpressumPage } from './pages/ImpressumPage';
import { DatenschutzPage } from './pages/DatenschutzPage';

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
                <Route path="/" element={<HomePage />} />
                <Route path="/rezeptwelt" element={<Suspense fallback={null}><RecipeWorldPage /></Suspense>} />
                <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
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
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/impressum" element={<ImpressumPage />} />
                <Route path="/datenschutz" element={<DatenschutzPage />} />
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
