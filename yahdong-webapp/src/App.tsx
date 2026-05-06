import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from './components/ui/sonner'
import { queryClient } from './lib/queryClient'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProjectsPage from './pages/ProjectsPage'
import BoardPage from './pages/BoardPage'
import InvitePage from './pages/InvitePage'
import PublicBoardPage from './pages/PublicBoardPage'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Navigate to="/projects" replace />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <AppShell>
                  <ProjectsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <AppShell>
                  <BoardPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/b/:shareToken" element={<PublicBoardPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
