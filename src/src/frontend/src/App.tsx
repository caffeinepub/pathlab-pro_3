import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import Approval from "./pages/Approval";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";
import NewReport from "./pages/NewReport";
import Patients from "./pages/Patients";
import Reports from "./pages/Reports";
import ResultEntry from "./pages/ResultEntry";
import SampleCollection from "./pages/SampleCollection";
import Settings from "./pages/Settings";
import TestCatalog from "./pages/TestCatalog";
import UserManagement from "./pages/UserManagement";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});
const patientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/patients",
  component: Patients,
});
const testCatalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/test-catalog",
  component: TestCatalog,
});
const newReportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/new-report",
  component: NewReport,
});
const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: Reports,
});
const billingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/billing",
  component: Billing,
});
const samplesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/samples",
  component: SampleCollection,
});
const resultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/results",
  component: ResultEntry,
});
const approvalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/approval",
  component: Approval,
});
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: Settings,
});
const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: UserManagement,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  patientsRoute,
  testCatalogRoute,
  newReportRoute,
  reportsRoute,
  billingRoute,
  samplesRoute,
  resultsRoute,
  approvalRoute,
  settingsRoute,
  usersRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </>
  );
}
