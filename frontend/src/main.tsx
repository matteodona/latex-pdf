import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { ProtectedRoute } from './auth/ProtectedRoute.tsx'
import { SuperuserRoute } from './auth/SuperuserRoute.tsx'
import { LoginPage } from './auth/LoginPage.tsx'
import { RegisterPage } from './auth/RegisterPage.tsx'
import { AdminPage } from './auth/AdminPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <SuperuserRoute>
                  <AdminPage />
                </SuperuserRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:templateId"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
