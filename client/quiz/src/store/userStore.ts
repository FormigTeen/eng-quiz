import { atom } from 'jotai';

// Definição da "memória global" do usuário
export const userAtom = atom({
  email: 'Visitante',
  isAuthenticated: false,
  token: ''
});