import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import type {} from '@mui/material/themeCssVarsAugmentation';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from './AppTheme';
import { AuthProvider } from './auth/AuthContext';
import { AppShell } from './layout/AppShell';
import { HomePage } from './pages/HomePage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';

function App() {
  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <AuthProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </AuthProvider>
    </AppTheme>
  );
}

export default App;
