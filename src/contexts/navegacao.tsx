import { createContext, useContext } from 'react';

type NavegacaoContextType = {
  irParaPagina: (index: number) => void;
};

export const NavegacaoContext = createContext<NavegacaoContextType>({
  irParaPagina: () => {},
});

export function useNavegacao() {
  return useContext(NavegacaoContext);
}