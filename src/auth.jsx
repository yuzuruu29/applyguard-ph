// auth.jsx — AuthProvider + useAuth hook. Exposes the Supabase session,
// entitlement, and AI usage to the rest of the app. Must be mounted inside
// <AppProvider> because AccountPage needs useApp's notify.
import { createContext, useContext, useEffect, useState } from "react";
import { supabase, backendEnabled } from "./lib/supabase.js";
import { effectiveTier, monthlyUsage, AI_MONTHLY_CAP } from "./lib/entitlement.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(backendEnabled);
  const [entitlement, setEntitlement] = useState(null);
  const [aiUsageRows, setAiUsageRows] = useState([]);

  // ── Session listener ──────────────────────────────────────────────
  useEffect(() => {
    if (!backendEnabled) {
      setLoading(false);
      return undefined;
    }

    // Restore session from storage on mount.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes (magic-link sign-in, sign-out).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // ── Fetch entitlement when the user changes ───────────────────────
  useEffect(() => {
    if (!user) {
      setEntitlement(null);
      setAiUsageRows([]);
      return undefined;
    }

    let cancelled = false;

    async function fetchData() {
      const [{ data: ent }, { data: usage }] = await Promise.all([
        supabase.from("entitlements").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("ai_usage").select("created_at").eq("user_id", user.id),
      ]);
      if (!cancelled) {
        setEntitlement(ent);
        setAiUsageRows(Array.isArray(usage) ? usage : []);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values ─────────────────────────────────────────────────
  const tier = effectiveTier(entitlement);
  const usageCount = monthlyUsage(aiUsageRows);
  const aiCap = AI_MONTHLY_CAP;

  const refreshEntitlement = async () => {
    if (!user || !backendEnabled) return;
    const { data } = await supabase
      .from("entitlements")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setEntitlement(data);
    const { data: usage } = await supabase
      .from("ai_usage")
      .select("created_at")
      .eq("user_id", user.id);
    setAiUsageRows(Array.isArray(usage) ? usage : []);
  };

  // ── Auth actions ───────────────────────────────────────────────────
  const signInWithEmail = async (email) => {
    if (!backendEnabled) throw new Error("Backend not configured");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/account" },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!backendEnabled) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setEntitlement(null);
    setAiUsageRows([]);
  };

  const value = {
    user,
    loading,
    backendEnabled,
    entitlement,
    tier,
    usageCount,
    aiCap,
    refreshEntitlement,
    signInWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
