import type { Metadata } from "next";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import "./globals.css";

/**
 * Unmatched URLs (the static host serves this as `404.html`). It cannot know the visitor's locale, so it is bilingual:
 * both languages, each with its own `lang`/`dir`. The preview banner (EN + AR) and noindex stay on it too.
 */
export const metadata: Metadata = { title: "404 — RAD-LAB", robots: { index: false, follow: false } };

export default function GlobalNotFound() {
  const langs = [
    { code: "en", dir: "ltr", m: en },
    { code: "ar", dir: "rtl", m: ar },
  ] as const;
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="site-chrome border-b border-line bg-panel">
          {langs.map(({ code, dir, m }) => (
            <p
              key={code}
              role="note"
              lang={code}
              dir={dir}
              data-testid="preview-banner"
              className="border-b border-signal/60 bg-signal/25 px-4 py-1.5 text-center text-sm font-semibold text-ink"
            >
              {m.common.previewBanner}
            </p>
          ))}
          <div className="mx-auto max-w-7xl px-4 py-3">
            <span dir="ltr" className="text-xl font-bold tracking-wide text-brand-strong">
              RAD<span className="text-signal">·</span>LAB
            </span>
          </div>
        </header>
        <main id="main-content" className="platform-page mx-auto max-w-3xl space-y-10 px-4 py-16">
          {langs.map(({ code, dir, m }) => (
            <section key={code} lang={code} dir={dir} data-testid={`not-found-${code}`}>
              <h1 className="text-2xl font-bold">{m.notFound.title}</h1>
              <p className="mt-3 text-lg text-muted">{m.notFound.body}</p>
              <p className="mt-4">
                <a href={`/${code}`} className="inline-flex min-h-6 items-center rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-strong">
                  {m.common.backHome}
                </a>
              </p>
            </section>
          ))}
        </main>
        <footer className="site-chrome border-t border-line bg-panel">
          {langs.map(({ code, dir, m }) => (
            <p key={code} role="note" lang={code} dir={dir} className="mx-auto max-w-7xl px-4 py-3 text-sm text-muted">
              {m.common.disclaimer}
              <a href={`/${code}/credits`} className="ms-3 inline-block min-h-6 text-brand underline">{m.common.creditsLink}</a>
            </p>
          ))}
        </footer>
      </body>
    </html>
  );
}
