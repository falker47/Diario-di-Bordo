import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">Accedi</h1>
        <p className="mb-5 text-sm text-slate-500">
          Area riservata agli educatori della comunità.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link to="/" className="text-slate-500 hover:text-slate-700">
            ← Torna al diario pubblico
          </Link>
        </p>
      </div>
    </div>
  );
}
