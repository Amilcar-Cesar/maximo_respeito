import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { setAuthToken } from '../lib/http';
import { loginAdmin } from '../services/admin.service';

const storageKey = 'maximo-admin-token';

export function useAdminSession() {
  const [token, setTokenState] = useState(() => localStorage.getItem(storageKey) ?? '');
  const [username, setUsername] = useState(() => localStorage.getItem('maximo-admin-username') ?? '');

  useEffect(() => {
    setAuthToken(token || null);
  }, [token]);

  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: (session) => {
      localStorage.setItem(storageKey, session.token);
      localStorage.setItem('maximo-admin-username', session.username);
      setAuthToken(session.token);
      setTokenState(session.token);
      setUsername(session.username);
    }
  });

  const logout = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem('maximo-admin-username');
    setTokenState('');
    setUsername('');
    setAuthToken(null);
  };

  return {
    token,
    username,
    isAuthenticated: Boolean(token),
    login: loginMutation.mutateAsync,
    loginMutation,
    logout
  };
}
