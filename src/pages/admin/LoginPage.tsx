import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const { signIn, isAuthenticated, isSuperadmin, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(isSuperadmin ? "/superadmin" : "/admin", { replace: true });
    }
  }, [loading, isAuthenticated, isSuperadmin, navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Inserisci username e password.");
      return;
    }
    setSubmitting(true);
    const result = await signIn(username, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    // Redirect viene gestito dall'effect quando isAuthenticated cambia.
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-app px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-hairline bg-surface p-6 shadow-card">
        <h1 className="mb-1 text-xl font-semibold text-primary">Accedi</h1>
        <p className="mb-5 text-sm text-muted">
          Area riservata agli educatori della comunità.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-primary">
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="mt-1 block w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="block text-sm font-medium text-primary">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1 block w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-inverted px-4 py-2 text-sm font-medium text-on-inverted shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link to="/" className="text-muted hover:text-primary">
            ← Torna al diario pubblico
          </Link>
        </p>
      </div>
    </div>
  );
}
