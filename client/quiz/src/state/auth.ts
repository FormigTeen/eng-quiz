import { atom } from 'jotai';

// Persist token in localStorage
const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

export const authTokenAtom = atom<string | null>(storedToken);

export const isAuthenticatedAtom = atom((get) => Boolean(get(authTokenAtom)));

export const setAuthTokenAtom = atom(null, (_get, set, token: string | null) => {
  set(authTokenAtom, token);
  if (typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }
});

