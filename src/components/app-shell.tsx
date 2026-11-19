import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarRange, LogOut, Radio, Users } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { exitDemoMode, isDemoMode } from "@/lib/demo";

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hidden items-baseline gap-2 md:flex">
      <span className="eyebrow">Local</span>
      <span className="timecode text-sm text-foreground">{format(now, "HH:mm:ss")}</span>
    </div>
  );
}

const navLinkClass =
  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    const demo = isDemoMode();
    exitDemoMode();
    if (!demo) await supabase.auth.signOut();
    navigate({ to: "/auth", search: {}, replace: true });
  }

  return (
    <div className="min-h-screen console-bg">
      <header className="no-print sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link to="/events" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Radio className="size-4" />
            </span>
            <span className="font-display text-base font-bold tracking-tight">
              BroadcastOps <span className="text-primary">Planner</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/events"
              className={navLinkClass}
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              <CalendarRange className="size-4" />
              Events
            </Link>
            <Link
              to="/resources"
              className={navLinkClass}
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              <Users className="size-4" />
              Crew &amp; Gear
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <LiveClock />
            <span className="hidden max-w-48 truncate text-xs text-muted-foreground lg:inline">
              {isDemoMode() ? "Demo mode" : user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  actions,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
