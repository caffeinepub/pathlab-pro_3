import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";
import NewReport from "./pages/NewReport";
import Patients from "./pages/Patients";
import Reports from "./pages/Reports";
import TestCatalog from "./pages/TestCatalog";

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

const routeTree = rootRoute.addChildren([
  indexRoute,
  patientsRoute,
  testCatalogRoute,
  newReportRoute,
  reportsRoute,
  billingRoute,
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
