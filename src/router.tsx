import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { todayISO } from "@/lib/dates";
import DayPage from "@/pages/public/DayPage";
import WeekPage from "@/pages/public/WeekPage";
import MonthPage from "@/pages/public/MonthPage";
import YearPage from "@/pages/public/YearPage";

// Code-split: le pagine admin/superadmin vengono caricate al primo accesso.
// La vista pubblica (entry point più comune) resta nel bundle principale.
const LoginPage = lazy(() => import("@/pages/admin/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage"));
const NewContributionPage = lazy(
  () => import("@/pages/admin/NewContributionPage"),
);
const EditContributionPage = lazy(
  () => import("@/pages/admin/EditContributionPage"),
);
const MenuPage = lazy(() => import("@/pages/superadmin/MenuPage"));
const PostsPage = lazy(() => import("@/pages/superadmin/PostsPage"));
const UsersPage = lazy(() => import("@/pages/superadmin/UsersPage"));

function PageShell({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
    </main>
  );
}

function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageShell title="Caricamento…" />}>{children}</Suspense>
  );
}

function HomeRedirect() {
  return <Navigate to={`/giorno/${todayISO()}`} replace />;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageShell title="Caricamento…" />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function RequireSuperadmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, isSuperadmin, loading } = useAuth();
  if (loading) return <PageShell title="Caricamento…" />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (!isSuperadmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: "/", element: <HomeRedirect /> },
  { path: "/giorno/:date", element: <DayPage /> },
  { path: "/settimana/:isoWeek", element: <WeekPage /> },
  { path: "/mese/:yyyymm", element: <MonthPage /> },
  { path: "/anno/:yyyy", element: <YearPage /> },

  {
    path: "/admin/login",
    element: (
      <LazyRoute>
        <LoginPage />
      </LazyRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <RequireAuth>
        <LazyRoute>
          <DashboardPage />
        </LazyRoute>
      </RequireAuth>
    ),
  },
  {
    path: "/admin/nuovo",
    element: (
      <RequireAuth>
        <LazyRoute>
          <NewContributionPage />
        </LazyRoute>
      </RequireAuth>
    ),
  },
  {
    path: "/admin/modifica/:id",
    element: (
      <RequireAuth>
        <LazyRoute>
          <EditContributionPage />
        </LazyRoute>
      </RequireAuth>
    ),
  },
  {
    path: "/superadmin",
    element: (
      <RequireSuperadmin>
        <LazyRoute>
          <MenuPage />
        </LazyRoute>
      </RequireSuperadmin>
    ),
  },
  {
    path: "/superadmin/posts",
    element: (
      <RequireSuperadmin>
        <LazyRoute>
          <PostsPage />
        </LazyRoute>
      </RequireSuperadmin>
    ),
  },
  {
    path: "/superadmin/utenti",
    element: (
      <RequireSuperadmin>
        <LazyRoute>
          <UsersPage />
        </LazyRoute>
      </RequireSuperadmin>
    ),
  },

  {
    path: "*",
    element: <PageShell title="Pagina non trovata" subtitle="Controlla l'URL." />,
  },
]);
