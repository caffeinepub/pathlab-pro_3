import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Beaker,
  CheckCircle2,
  ClipboardList,
  FilePlus,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  Receipt,
  Settings,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/test-catalog", label: "Test Catalog", icon: FlaskConical },
  { to: "/samples", label: "Samples", icon: Beaker },
  { to: "/new-report", label: "New Report", icon: FilePlus },
  { to: "/results", label: "Results", icon: ClipboardList },
  { to: "/approval", label: "Approval", icon: CheckCircle2 },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/users", label: "Users", icon: UserCog },
];

interface LayoutProps {
  children: React.ReactNode;
}

function LoginScreen() {
  const { login, loginStatus, isLoginError } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          {/* Header banner */}
          <div className="bg-primary px-8 py-10 flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="bg-white/15 rounded-2xl p-4"
            >
              <img
                src="/assets/generated/pathlab-logo-transparent.dim_120x120.png"
                alt="PathLab Pro"
                className="h-16 w-16"
              />
            </motion.div>
            <div className="text-center">
              <h1 className="text-primary-foreground font-bold text-2xl tracking-tight">
                PathLab Pro
              </h1>
              <p className="text-primary-foreground/80 text-sm mt-1">
                Pathology Lab Management System
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8 flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-foreground text-xl font-semibold">
                PathLab Pro mein Swagat hai
              </h2>
              <p className="text-muted-foreground text-sm mt-2">
                Lab management ke liye login karein
              </p>
            </div>

            <AnimatePresence mode="wait">
              {isLoginError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3"
                  data-ocid="login.error_state"
                >
                  <p className="text-destructive text-sm text-center">
                    Login nahi hua. Browser mein popup allow karein aur dobara
                    try karein.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              size="lg"
              className="w-full text-base h-12 font-semibold"
              onClick={() => login()}
              disabled={isLoggingIn}
              data-ocid="login.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Login ho raha hai...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In / Login
                </>
              )}
            </Button>

            <p className="text-muted-foreground text-xs text-center leading-relaxed">
              Internet Identity se login karein. Pehli baar login karne par ek
              naya account banega.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const { login, clear, isInitializing, identity } = useInternetIdentity();
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Use identity directly — loginStatus can be "idle" even for restored sessions
  const isLoggedIn = !!identity;

  // Show loading while initializing auth state
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:flex",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <img
            src="/assets/generated/pathlab-logo-transparent.dim_120x120.png"
            alt="PathLab Pro"
            className="h-10 w-10 rounded-full bg-white/10"
          />
          <div>
            <p className="text-sidebar-foreground font-bold text-sm leading-tight">
              PathLab Pro
            </p>
            <p className="text-sidebar-foreground/60 text-xs">Diagnostics</p>
          </div>
          <button
            type="button"
            className="ml-auto lg:hidden text-sidebar-foreground/70"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
          data-ocid="nav.panel"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === "/"
                ? currentPath === "/"
                : currentPath.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
                data-ocid={`nav.${item.label.toLowerCase().replace(/\s+/g, "_")}.link`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          {isLoggedIn ? (
            <div className="space-y-2">
              <p className="text-sidebar-foreground/60 text-xs px-3 truncate">
                {identity.getPrincipal().toString().slice(0, 12)}...
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => clear()}
                data-ocid="nav.logout.button"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => login()}
              data-ocid="nav.login.button"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden w-full border-0"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 no-print">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-foreground font-semibold text-base">
              {NAV_ITEMS.find((i) =>
                i.to === "/"
                  ? currentPath === "/"
                  : currentPath.startsWith(i.to),
              )?.label || "PathLab Pro"}
            </h1>
            <p className="text-muted-foreground text-xs">
              PathLab Pro Diagnostics
            </p>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground no-print">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
