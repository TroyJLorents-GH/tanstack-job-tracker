import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { Root } from './components/Root';
import { JobList } from './components/JobList';
import { JobDetail } from './components/JobDetail';
import { JobForm } from './components/JobForm';
import { Documents } from './components/Documents';
import { Login } from './components/Login';
import { useAuth } from './context/AuthProvider';

// Root route
const rootRoute = createRootRoute({
  component: Root,
});

// Index route (job list)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: JobList,
});

// Job detail route
const jobDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/jobs/$jobId',
  component: JobDetail,
});

// New job form route
const newJobRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/jobs/new',
  component: JobForm,
});

// Edit job form route
const editJobRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/jobs/$jobId/edit',
  component: JobForm,
});

// Route tree
const LoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

const ProtectedDocuments = () => {
  const { user, isEnabled, loading } = useAuth();
  if (!isEnabled) return <Documents />; // allow during local dev without auth
  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <Login />;
  return <Documents />;
};

const DocumentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/documents',
  component: ProtectedDocuments,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  jobDetailRoute,
  newJobRoute,
  editJobRoute,
  DocumentsRoute,
  LoginRoute,
]);

// Router instance
export const router = createRouter({ routeTree });

// Type declarations
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
