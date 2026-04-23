import { Component, type ReactNode } from "react";

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Qualcosa è andato storto
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Si è verificato un errore imprevisto. Ricarica la pagina per riprovare.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Ricarica la pagina
            </button>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100"
            >
              Ignora
            </button>
          </div>
          {import.meta.env.DEV && (
            <details className="mt-4 text-left text-xs text-slate-500">
              <summary className="cursor-pointer">Dettagli (solo dev)</summary>
              <pre className="mt-2 overflow-auto rounded bg-slate-100 p-2">
                {this.state.error.stack ?? this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
