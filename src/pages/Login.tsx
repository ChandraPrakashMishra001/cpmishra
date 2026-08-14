import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf } from "lucide-react";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

const Login = () => {
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace(next);
    });
  }, [next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}${next}` },
      });
      setBusy(false);
      if (error) return setError(error.message);
      if (!data.session) return setMessage("Check your email to confirm your account, then come back.");
      window.location.replace(next);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    window.location.replace(next);
  };

  const google = async () => {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/login?next=${encodeURIComponent(next)}`,
    });
    if (result.error) {
      setBusy(false);
      return setError("Google sign-in failed. Please try again.");
    }
    if (result.redirected) return;
    window.location.replace(next);
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <Leaf className="w-8 h-8 mx-auto text-primary" />
          <CardTitle>{mode === "signin" ? "Sign in to Amanai" : "Create your Amanai account"}</CardTitle>
          <CardDescription>Continue to your BloomSense workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={google} disabled={busy}>
            Continue with Google
          </Button>
          <div className="text-center text-xs text-muted-foreground">or</div>
          <form className="space-y-3" onSubmit={submit}>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
          </form>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <button
            type="button"
            className="w-full text-xs text-muted-foreground underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </CardContent>
      </Card>
    </main>
  );
};

export default Login;
