import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { Root } from './components/Root';
import { JobList } from './components/JobList';
import { JobDetail } from './components/JobDetail';
import { JobForm } from './components/JobForm';

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
const routeTree = rootRoute.addChildren([
  indexRoute,
  jobDetailRoute,
  newJobRoute,
  editJobRoute,
]);

// Router instance
export const router = createRouter({ routeTree });

// Type declarations
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
