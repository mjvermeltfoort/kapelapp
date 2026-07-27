import { lazy, Suspense, type ReactNode } from 'react'
import { LoadingState } from '../components/LoadingState'
import { PageCard } from '../components/PageCard'

export const LoginPage = lazy(async () => import('../features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })))
export const OtpPage = lazy(async () => import('../features/auth/pages/OtpPage').then((module) => ({ default: module.OtpPage })))
export const AuthCallbackPage = lazy(
  async () => import('../features/auth/pages/AuthCallbackPage').then((module) => ({ default: module.AuthCallbackPage })),
)
export const JoinInvitePage = lazy(async () => import('../features/invites/pages/JoinInvitePage').then((module) => ({ default: module.JoinInvitePage })))
export const ProfileSetupPage = lazy(
  async () => import('../features/profile/pages/ProfileSetupPage').then((module) => ({ default: module.ProfileSetupPage })),
)
export const ProfilePage = lazy(async () => import('../features/profile/pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
export const BandSwitcherPage = lazy(
  async () => import('../features/bands/pages/BandSwitcherPage').then((module) => ({ default: module.BandSwitcherPage })),
)
export const PerformancesPage = lazy(
  async () => import('../features/performances/pages/PerformancesPage').then((module) => ({ default: module.PerformancesPage })),
)
export const PerformanceDetailPage = lazy(
  async () => import('../features/performances/pages/PerformanceDetailPage').then((module) => ({ default: module.PerformanceDetailPage })),
)
export const PerformanceCreatePage = lazy(
  async () => import('../features/performances/pages/PerformanceCreatePage').then((module) => ({ default: module.PerformanceCreatePage })),
)
export const PerformanceEditPage = lazy(
  async () => import('../features/performances/pages/PerformanceEditPage').then((module) => ({ default: module.PerformanceEditPage })),
)
export const AdminPage = lazy(async () => import('../features/admin/pages/AdminPage').then((module) => ({ default: module.AdminPage })))

function RouteFallback({ auth = false }: { auth?: boolean }) {
  const content = (
    <PageCard title="Laden" description="Scherm wordt klaargezet.">
      <LoadingState />
    </PageCard>
  )

  if (auth) {
    return <div className="auth-page">{content}</div>
  }

  return content
}

export function RouterElement({
  children,
  auth = false,
}: {
  children: ReactNode
  auth?: boolean
}) {
  return <Suspense fallback={<RouteFallback auth={auth} />}>{children}</Suspense>
}
