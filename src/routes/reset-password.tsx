import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — BroadcastOps Planner" },
      { name: "description", content: "Choose a new password for your BroadcastOps Planner account." },
      { property: "og:title", content: "Set a new password — BroadcastOps Planner" },
      { property: "og:description", content: "Choose a new password for your BroadcastOps Planner account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setIsRecovery(true);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/events" });
  }

  return (
    <div className="grid min-h-screen place-items-center console-bg px-4">
      <div className="panel w-full max-w-sm p-6">
        <h1 className="text-xl font-bold">Set a new password</h1>
        {isRecovery ? (
          <form onSubmit={submit} className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Update password"}
            </Button>
          </form>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Open this page from the reset link in your email to choose a new password.
          </p>
        )}
      </div>
    </div>
  );
}
