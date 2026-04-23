import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { SUPERADMIN_EMAIL, supabase, usernameToEmail } from "@/lib/supabase";
import type { Profile } from "@/types";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isSuperadmin: boolean;
  loading: boolean;
  profileLoading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Fetch profile on user change. Il superadmin non ha profilo: resta null.
  const userId = session?.user?.id ?? null;
  const userEmail = session?.user?.email ?? null;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    if (userEmail === SUPERADMIN_EMAIL) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      setProfile(data ?? null);
      setProfileLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, userEmail]);

  const signIn = useCallback(async (username: string, password: string) => {
    const email = usernameToEmail(username);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "Username o password non validi." };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    return {
      session,
      user,
      profile,
      isAuthenticated: user !== null,
      isSuperadmin: user?.email === SUPERADMIN_EMAIL,
      loading,
      profileLoading,
      signIn,
      signOut,
    };
  }, [session, profile, loading, profileLoading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve essere usato dentro <AuthProvider>.");
  }
  return ctx;
}
