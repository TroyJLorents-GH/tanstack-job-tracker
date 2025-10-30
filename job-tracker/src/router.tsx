import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import { Root } from './components/Root'
import { JobList } from './components/JobList'
import { JobDetail } from './components/JobDetail'
import { JobForm } from './components/JobForm'
import { Documents } from './components/Documents'
import { Login } from './components/Login'
import { Discover } from './components/Discover'
import { Landing } from './components/Landing'
import { useAuth } from './context/AuthProvider'

// Root layout (no data fetching here)
const rootRoute = createRootRoute({
  component: Root,
})

// --- Simple auth HOC for protected pages ---
const withAuth = <P extends object>(Component: React.ComponentType<P>) =>
  (props: P) => {
    const { user, isEnabled, loading } = useAuth()
    if (!isEnabled) return <Component {...props} /> // local dev/demo
    if (loading) return <div className="p-6">Loading…</div>
    if (!user) return <Login />
    return <Component {...props} />
  }

// --- Public routes ---
const LandingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Landing,
})

const DiscoverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/discover',
  component: Discover,
})

const LoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})

// --- Protected routes (/jobs & /documents) ---
const JobsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/jobs',
  component: withAuth(JobList),
})

const JobDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/jobs/$jobId',
  component: withAuth(JobDetail),
})

const NewJobRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/jobs/new',
  component: withAuth(JobForm),
})

const EditJobRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/jobs/$jobId/edit',
  component: withAuth(JobForm),
})

const DocumentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/documents',
  component: withAuth(Documents),
  validateSearch: (search: any) => ({
    ai: search?.ai as 'resume' | 'cover_letter' | undefined,
    companyName: search?.companyName as string | undefined,
    position: search?.position as string | undefined,
    jobDescription: search?.jobDescription as string | undefined,
  }),
})

// --- Route tree ---
const routeTree = rootRoute.addChildren([
  LandingRoute,
  DiscoverRoute,
  LoginRoute,

  JobsIndexRoute,
  JobDetailRoute,
  NewJobRoute,
  EditJobRoute,
  DocumentsRoute,
])

// Router instance
export const router = createRouter({ routeTree })

// Type declarations
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
