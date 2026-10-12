import { useCallback, useEffect, useState } from "react";

export type Tema = "light" | "dark";

const CHAVE = "frota:tema";

function lerTema(): Tema {
  try {
    const salvo = window.localStorage.getItem(CHAVE);
    if (salvo === "light" || salvo === "dark") return salvo;
  } catch {
    /* armazenamento indisponível: segue a preferência do sistema */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function aplicarTema(tema: Tema): void {
  const raiz = document.documentElement;
  raiz.classList.toggle("dark", tema === "dark");
  raiz.style.colorScheme = tema;
}

// Aplica o tema assim que o bundle carrega, antes do React montar, para reduzir o "piscar" ao recarregar.
if (typeof window !== "undefined") aplicarTema(lerTema());

export function useTheme() {
  // O servidor não conhece a preferência: começa "light" e sincroniza no cliente para evitar erro de hidratação.
  const [tema, setTema] = useState<Tema>("light");

  useEffect(() => {
    const atual = lerTema();
    setTema(atual);
    aplicarTema(atual);
  }, []);

  const alternar = useCallback(() => {
    const proximo: Tema = tema === "dark" ? "light" : "dark";
    setTema(proximo);
    aplicarTema(proximo);
    try {
      window.localStorage.setItem(CHAVE, proximo);
    } catch {
      /* sem persistência, o tema vale só nesta sessão */
    }
  }, [tema]);

  return { tema, alternar };
}
