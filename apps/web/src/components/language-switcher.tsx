import { startTransition } from "react";

import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "./ui/button";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "vi", label: "VI" },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language ?? "en";

  return (
    <div
      aria-label={t("languageSwitcher.label")}
      className={cn("inline-flex items-center gap-1 rounded-full border border-border bg-card p-1", className)}
      role="group"
    >
      {LANGUAGES.map(({ code, label }) => {
        const isActive = activeLanguage === code;

        return (
          <Button
            aria-pressed={isActive}
            className="min-h-8 rounded-full px-3 py-1.5 text-xs tracking-[0.12em]"
            key={code}
            onClick={() => {
              if (isActive) {
                return;
              }

              startTransition(() => {
                void i18n.changeLanguage(code);
              });
            }}
            size="xs"
            type="button"
            variant={isActive ? "default" : "ghost"}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
