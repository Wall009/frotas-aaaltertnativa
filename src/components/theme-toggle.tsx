import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { tema, alternar } = useTheme();
  const escuro = tema === "dark";
  const rotulo = escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro";

  return (
    <Button variant="ghost" size="icon" onClick={alternar} title={rotulo} aria-label={rotulo}>
      {escuro ? <Sun /> : <Moon />}
    </Button>
  );
}
