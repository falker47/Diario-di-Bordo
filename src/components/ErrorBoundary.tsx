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
      <div className="flex min-h-screen flex-col items-center justify-center bg-app p-6 text-center">
        <div className="max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-card">
          <h1 className="text-xl font-semibold text-primary">
            Qualcosa è andato storto
          </h1>
          <p className="mt-2 text-sm text-secondary">
            Si è verificato un errore imprevisto. Ricarica la pagina per riprovare.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-inverted px-4 py-2 text-sm font-medium text-on-inverted shadow-sm hover:opacity-90"
            >
              Ricarica la pagina
            </button>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="rounded-lg border border-hairline-strong bg-surface px-4 py-2 text-sm font-medium text-secondary shadow-sm hover:bg-surface-2"
            >
              Ignora
            </button>
          </div>
          {import.meta.env.DEV && (
            <details className="mt-4 text-left text-xs text-muted">
              <summary className="cursor-pointer">Dettagli (solo dev)</summary>
              <pre className="mt-2 overflow-auto rounded bg-surface-2 p-2 text-primary">
                {this.state.error.stack ?? this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
