"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { validName } from "./training";

export function ProfileName({ name, email, save }: { name: string | null; email: string; save: (value: string) => Promise<boolean> }) {
  const t = useTranslations("training");
  const [committed, setCommitted] = useState(name ?? "");
  const [value, setValue] = useState(name ?? "");
  const [editing, setEditing] = useState(!validName(name ?? ""));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const cancel = () => { setValue(committed); setState("idle"); setEditing(false); };
  return <section className="mt-5 rounded-lg border border-line bg-panel p-5" aria-labelledby="personal-title" data-testid="profile-name">
    <h2 id="personal-title" className="text-xl font-semibold">{t("personal")}</h2>
    {editing ? <form className="mt-4 max-w-md space-y-3" onSubmit={(e) => {
      e.preventDefault(); if (!validName(value)) return;
      const next = value.trim(); setState("saving");
      void save(next).then(ok => {
        if (ok) { setCommitted(next); setValue(next); setEditing(false); setState("saved"); }
        else setState("error");
      }).catch(() => setState("error"));
    }}>
      <label className="block">{t("name")}<input name="displayName" autoFocus disabled={state === "saving"} autoComplete="name" dir="auto" required maxLength={100} value={value} onChange={(e) => { setValue(e.target.value); setState("idle"); }} className="mt-1 block w-full rounded-md border border-line bg-panel px-3 py-2" aria-describedby="name-hint" /></label>
      <p id="name-hint" className="text-sm text-muted">{t("nameHint")}</p>
      <p className="text-sm">{t("email")} <bdi className="break-all">{email}</bdi></p>
      <div className="flex flex-wrap gap-3">
        <button disabled={state === "saving" || !validName(value)} className="rounded-md bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60">{t(state === "saving" ? "saving" : "save")}</button>
        {committed && <button type="button" disabled={state === "saving"} className="rounded-md border border-line px-4 py-2 disabled:opacity-60" onClick={cancel}>{t("cancelName")}</button>}
      </div>
      {state === "error" && <p role="alert">{t("saveError")}</p>}
    </form> : <div className="mt-4 space-y-3">
      <p>{t("name")}: <bdi dir="auto" className="break-words">{committed}</bdi></p>
      <p className="text-sm">{t("email")} <bdi className="break-all">{email}</bdi></p>
      <button type="button" className="min-h-11 rounded-md border border-line px-4 py-2" onClick={() => { setValue(committed); setState("idle"); setEditing(true); }}>{t("editName")}</button>
    </div>}
    {state === "saved" && <p role="status" className="mt-3">{t("saved")}</p>}
  </section>;
}
