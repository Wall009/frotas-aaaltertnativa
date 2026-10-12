import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="flex items-stretch gap-3">
        <span aria-hidden className="w-1 shrink-0 rounded-full bg-gradient-to-b from-primary to-accent" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[1.75rem]">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
