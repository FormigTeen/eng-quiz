import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../api/client';
import { useAtom, useAtomValue } from 'jotai';
import { authTokenAtom, setAuthTokenAtom } from '../state/auth';

export type AuthUser = {
  email: string;
  role?: string;
  createdAt?: string;
  level?: number;
  xp?: number;
  sequence?: { updated_at: string | null; count: number };
  score?: { positive: number; negative: number };
  wallet?: { count: number; credits: number };
  badges?: { iconUrl: string | null; title: string; description: string | null }[];
} | false;

export function useAuth() {
  const queryClient = useQueryClient();
  const token = useAtomValue(authTokenAtom);
  const [, setToken] = useAtom(setAuthTokenAtom);

  const authQuery = useQuery({
    queryKey: ['auth', 'me', token],
    enabled: Boolean(token),
    queryFn: async () => {
      const user = await apiPost<AuthUser>('/auth/v1/auth', { token });
      return user && user !== false ? user : null;
    }
  });

  const loginMutation = useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiPost<{ token: string } | boolean>('/auth/v1/login', { email, password });
      if (!res || res === false || typeof (res as any).token !== 'string') {
        throw new Error('Credenciais inválidas');
      }
      return res as { token: string };
    },
    onSuccess: (data) => {
      setToken(data.token);
      // Warm user cache
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    }
  });

  const registerMutation = useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const ok = await apiPost<boolean>('/auth/v1/register', { email, password });
      if (!ok) throw new Error('Email já cadastrado ou inválido');
      return ok;
    }
  });

  const signOut = useCallback(() => {
    setToken(null);
    queryClient.removeQueries({ queryKey: ['auth'] });
  }, [queryClient, setToken]);

  const logoutMutation = useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: async () => {
      if (!token) return true; // já está deslogado
      const ok = await apiPost<boolean>('/auth/v1/logout', { token });
      return ok === true;
    },
    onSettled: () => {
      // Sempre limpar o estado local independente do resultado
      signOut();
    }
  });

  return {
    token,
    user: authQuery.data || null,
    authQuery,
    sendLogin: loginMutation.mutateAsync,
    sendRegister: registerMutation.mutateAsync,
    sendLogout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error as Error | null,
    registerError: registerMutation.error as Error | null,
    signOut
  };
}
