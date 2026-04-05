import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function CartListLogo() {
  return (
    <svg aria-label="CartList" viewBox="0 0 32 32" width="40" height="40" fill="none">
      <rect width="32" height="32" rx="8" fill="currentColor" className="text-primary" />
      <path d="M8 10h2l3 9h8l2-6H11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="13.5" cy="21.5" r="1.5" fill="white" />
      <circle cx="19.5" cy="21.5" r="1.5" fill="white" />
    </svg>
  );
}

export default function AuthPage({ onAuth }: { onAuth: (user: any) => void }) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data: object) =>
      apiRequest("POST", mode === "login" ? "/api/auth/login" : "/api/auth/signup", data),
    onSuccess: (data: any) => {
      onAuth(data);
    },
    onError: async (err: any) => {
      try {
        const body = await err.response?.json?.();
        setError(body?.error ?? "Something went wrong. Please try again.");
      } catch {
        setError("Something went wrong. Please try again.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    mutation.mutate(mode === "login"
      ? { email, password }
      : { email, password, name }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <CartListLogo />
          <div className="text-center">
            <h1 className="font-bold text-xl">CartList</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login" ? "Sign in to your account" : "Create your free account"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                data-testid="input-name"
                placeholder="e.g. Patrick"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              data-testid="input-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete={mode === "login" ? "email" : "new-email"}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              data-testid="input-password"
              type="password"
              placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg" data-testid="auth-error">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            data-testid="button-submit-auth"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? (mode === "login" ? "Signing in…" : "Creating account…")
              : (mode === "login" ? "Sign In" : "Create Account")}
          </Button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            className="text-primary font-medium hover:underline"
            data-testid="button-toggle-mode"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
