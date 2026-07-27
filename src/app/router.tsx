import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import {
  AdminPage,
  AuthCallbackPage,
  BandSwitcherPage,
  JoinInvitePage,
  LoginPage,
  OtpPage,
  PerformanceCreatePage,
  PerformanceDetailPage,
  PerformanceEditPage,
  PerformancesPage,
  ProfilePage,
  ProfileSetupPage,
  RouterElement,
} from './routerElements'
import { RequireAuth } from './router/RequireAuth'
import { RequireGuest } from './router/RequireGuest'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <RequireGuest><RouterElement auth><LoginPage /></RouterElement></RequireGuest>,
  },
  {
    path: '/otp',
    element: <RequireGuest><RouterElement auth><OtpPage /></RouterElement></RequireGuest>,
  },
  {
    path: '/auth/callback',
    element: <RouterElement auth><AuthCallbackPage /></RouterElement>,
  },
  {
    path: '/join/:token',
    element: <RouterElement auth><JoinInvitePage /></RouterElement>,
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
      { path: 'profile/setup', element: <RouterElement><ProfileSetupPage /></RouterElement> },
      { path: 'profile', element: <RouterElement><ProfilePage /></RouterElement> },
      { path: 'bands', element: <RouterElement><BandSwitcherPage /></RouterElement> },
      { path: 'performances', element: <RouterElement><PerformancesPage /></RouterElement> },
      { path: 'performances/new', element: <RouterElement><PerformanceCreatePage /></RouterElement> },
      { path: 'performances/:performanceId', element: <RouterElement><PerformanceDetailPage /></RouterElement> },
      { path: 'performances/:performanceId/edit', element: <RouterElement><PerformanceEditPage /></RouterElement> },
      {
        path: 'performances/:performanceId/planner-overview',
        element: <RouterElement><PerformanceDetailPage /></RouterElement>,
      },
      { path: 'admin', element: <RouterElement><AdminPage /></RouterElement> },
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
