'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  plan: 'free' | 'basic' | 'platinum';
  age?: number;
  family_info?: string;
  current_assets?: string;
  monthly_savings?: number;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount?: number;
  target_date?: string;
  notes?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  goals: Goal[];
  isPaid: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshGoals: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, goals: [], isPaid: false, loading: true,
  refreshProfile: async () => {}, refreshGoals: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data as UserProfile);
  }, [supabase]);

  const refreshGoals = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at');
    if (data) setGoals(data as Goal[]);
  }, [supabase]);

  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await Promise.all([refreshProfile(), refreshGoals()]);
      }
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([refreshProfile(), refreshGoals()]);
      } else {
        setProfile(null);
        setGoals([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, refreshProfile, refreshGoals]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isPaid = profile?.plan === 'basic' || profile?.plan === 'platinum';

  return (
    <AuthContext.Provider value={{ user, profile, goals, isPaid, loading, refreshProfile, refreshGoals, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
