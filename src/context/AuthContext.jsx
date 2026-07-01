import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const clearPasswordRecovery = () => setPasswordRecovery(false);

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password });

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = () => supabase.auth.signOut();

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

  const updatePassword = (password) =>
    supabase.auth.updateUser({ password });

  const resetPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });

  return (
    <AuthContext.Provider value={{
      user, loading, signUp, signIn, signOut, signInWithGoogle,
      updatePassword, resetPassword, passwordRecovery, clearPasswordRecovery,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
