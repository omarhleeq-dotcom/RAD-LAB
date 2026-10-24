"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { validName } from "./training";

export function ProfileName({ name, email, save }: { name: string | null; email: string; save: (value: string) => Promise<boolean> }) {
  const t = useTranslations("training");
  const [value, setValue] = useState(name ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  return <section className="mt-5 rounded-lg border border-line bg-panel p-5" aria-labelledby="personal-title" data-testid="profile-name">
    <h2 id="personal-title" className="text-xl font-semibold">{t("personal")}</h2>
    <form className="mt-4 max-w-md space-y-3" onSubmit={(e) => { e.preventDefault(); if (!validName(value)) return; setState("saving"); void save(value.trim()).then((ok) => setState(ok ? "saved" : "error")); }}>
      <label className="block">{t("name")}<input name="displayName" disabled={state === "saving"} autoComplete="name" dir="auto" required maxLength={100} value={value} onChange={(e) => { setValue(e.target.value); setState("idle"); }} className="mt-1 block w-full rounded-md border border-line bg-panel px-3 py-2" aria-describedby="name-hint" /></label>
      <p id="name-hint" className="text-sm text-muted">{t("nameHint")}</p>
      <p className="text-sm">{t("email")} <bdi className="break-all">{email}</bdi></p>
      <button disabled={state === "saving" || !validName(value)} className="rounded-md bg-brand px-4 py-2 font-semibold text-on-brand disabled:opacity-60">{t(state === "saving" ? "saving" : "save")}</button>
      {state === "saved" && <p role="status">{t("saved")}</p>}
      {state === "error" && <p role="alert">{t("saveError")}</p>}
    </form>
  </section>;
}
