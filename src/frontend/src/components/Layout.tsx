import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  FilePlus,
  FileText,
  FlaskConical,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Receipt,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/test-catalog", label: "Test Catalog", icon: FlaskConical },
  { to: "/new-report", label: "New Report", icon: FilePlus },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/billing", label: "Billing", icon: Receipt },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isLoggedIn = loginStatus === "success" && !!identity;

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
        <nav className="flex-1 px-3 py-4 space-y-1" data-ocid="nav.panel">
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
