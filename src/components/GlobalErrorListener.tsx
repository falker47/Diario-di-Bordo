import { useEffect } from "react";
import { useToast } from "@/hooks/useToast";

// Ascolta unhandled promise rejections a livello globale e le mostra
// come toast, in modo che eventuali errori asincroni dimenticati non
// passino silenti.
export function GlobalErrorListener() {
  const { push } = useToast();

  useEffect(() => {
    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message =
        reason instanceof Error ? reason.message : String(reason ?? "Errore");
      push(`Errore: ${message}`, "error");
    }

    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, [push]);

  return null;
}
