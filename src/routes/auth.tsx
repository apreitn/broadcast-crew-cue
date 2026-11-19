import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value, "http://local");
    if (url.origin !== "http://local") return undefined;
    return url.pathname + url.search;
  } catch {
    return undefined;
  }
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = safeRedirect(search["redirect"]);
    return redirect ? { redirect } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — BroadcastOps Planner" },
      { name: "description", content: "Sign in to the BroadcastOps Planner production team workspace." },
      { property: "og:title", content: "Sign in — BroadcastOps Planner" },
      { property: "og:description", content: "Sign in to the BroadcastOps Planner production team workspace." },
    ],
  }),
  component: AuthPage,
});

const GoogleLogo = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="size-[18px]">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
  </svg>
);

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const target = search.redirect ?? "/events";

  useEffect(() => {
    const go = () => navigate({ to: target, replace: true });
    supabase.auth.getSession().then(({ data }) => data.session && go());
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) go();
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, target]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/events" },
        });
        if (error) throw error;
        if (!data.session) setNotice("Check your inbox to confirm your email, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setNotice("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "lovable") {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error(result.error.message ?? "Sign-in failed");
  }

  return (
    <div className="grid min-h-screen place-items-center console-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Radio className="size-6" />
          </span>
          <h1 className="text-2xl font-extrabold">
            BroadcastOps <span className="text-primary">Planner</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Crew, gear and schedules for live sports production.</p>
        </div>

        <div className="panel p-6">
          <p className="eyebrow mb-4">
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
          </p>

          {mode !== "reset" && (
            <>
              <div className="grid gap-2">
                <Button type="button" variant="google" className="w-full" onClick={() => oauth("google")}>
                  <GoogleLogo />
                  Continue with Google
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => oauth("lovable")}>
                  <LovableMark />
                  Continue with Lovable
                </Button>
              </div>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="eyebrow">or email</span>
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode !== "reset" && (
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setMode("reset")}>
                      Forgot?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            {notice && <p className="rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">{notice}</p>}
            <Button type="submit" className="mt-1 w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                New to the team?{" "}
                <button className="font-medium text-primary hover:underline" onClick={() => setMode("signup")}>
                  Create an account
                </button>
              </>
            ) : (
              <button className="font-medium text-primary hover:underline" onClick={() => setMode("signin")}>
                Back to sign in
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
