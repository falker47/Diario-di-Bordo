import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/hooks/useToast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalErrorListener } from "@/components/GlobalErrorListener";
import { router } from "@/router";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <GlobalErrorListener />
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
