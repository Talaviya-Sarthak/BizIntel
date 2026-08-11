import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode, useMemo } from 'react';
import type { User } from '../../../types/auth';
import {
  authService,
  type LoginInput,
  type RegisterInput,
} from '../../../services/api/auth.service';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AUTH_ME_QUERY_KEY = ['auth', 'me'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: authService.getCurrentUser,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const status: AuthStatus = meQuery.isLoading
    ? 'loading'
    : meQuery.data
      ? 'authenticated'
      : 'unauthenticated';

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (user) => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (user) => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      status,
      isAuthenticated: status === 'authenticated',
      signIn: async (input) => {
        await loginMutation.mutateAsync(input);
      },
      signUp: async (input) => {
        await registerMutation.mutateAsync(input);
      },
      signOut: async () => {
        await logoutMutation.mutateAsync();
      },
    }),
    [meQuery.data, status, loginMutation, registerMutation, logoutMutation],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
