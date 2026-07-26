import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { RequireAuth } from './router/RequireAuth'
import { RequireGuest } from './router/RequireGuest'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { OtpPage } from '../features/auth/pages/OtpPage'
import { AuthCallbackPage } from '../features/auth/pages/AuthCallbackPage'
import { JoinInvitePage } from '../features/invites/pages/JoinInvitePage'
import { ProfileSetupPage } from '../features/profile/pages/ProfileSetupPage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { BandSwitcherPage } from '../features/bands/pages/BandSwitcherPage'
import { PerformancesPage } from '../features/performances/pages/PerformancesPage'
import { PerformanceDetailPage } from '../features/performances/pages/PerformanceDetailPage'
import { PlannerOverviewPage } from '../features/performances/pages/PlannerOverviewPage'
import { PerformanceCreatePage } from '../features/performances/pages/PerformanceCreatePage'
import { PerformanceEditPage } from '../features/performances/pages/PerformanceEditPage'
import { AdminPage } from '../features/admin/pages/AdminPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RequireGuest>
        <LoginPage />
      </RequireGuest>
    ),
  },
  {
    path: '/otp',
    element: (
      <RequireGuest>
        <OtpPage />
      </RequireGuest>
    ),
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    path: '/join/:token',
    element: <JoinInvitePage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/bands" replace /> },
      { path: 'profile/setup', element: <ProfileSetupPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'bands', element: <BandSwitcherPage /> },
      { path: 'performances', element: <PerformancesPage /> },
      { path: 'performances/new', element: <PerformanceCreatePage /> },
      { path: 'performances/:performanceId', element: <PerformanceDetailPage /> },
      { path: 'performances/:performanceId/edit', element: <PerformanceEditPage /> },
      {
        path: 'performances/:performanceId/planner-overview',
        element: <PlannerOverviewPage />,
      },
      { path: 'admin', element: <AdminPage /> },
      { path: 'settings/band', element: <Navigate to="/admin?tab=band" replace /> },
      { path: 'settings/members', element: <Navigate to="/admin?tab=members" replace /> },
      { path: 'settings/invites', element: <Navigate to="/admin?tab=invites" replace /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
