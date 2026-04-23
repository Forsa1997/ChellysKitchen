import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router';
import type {} from '@mui/material/themeCssVarsAugmentation';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from './AppTheme';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { AppShell } from './layout/AppShell';
import { CreateRecipePage } from './pages/CreateRecipePage';
import { HomePage } from './pages/HomePage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';

function App() {
  const routerMode = import.meta.env.VITE_ROUTER_MODE ?? (import.meta.env.PROD ? 'hash' : 'browser');
  const RouterComponent = routerMode === 'hash' ? HashRouter : BrowserRouter;

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <AuthProvider>
        <RouterComponent>
          <AppShell>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/recipes/:id" element={<RecipeDetailPage />} />
              <Route
                path="/recipes/new"
                element={(
                  <RequireAuth>
                    <CreateRecipePage />
                  </RequireAuth>
                )}
              />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </RouterComponent>
      </AuthProvider>
    </AppTheme>
  );
}

export default App;
