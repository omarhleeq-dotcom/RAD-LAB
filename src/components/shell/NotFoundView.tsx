import { Link } from "@/i18n/navigation";

/** Shared by the localized 404 (`[locale]/not-found`) and the in-page "unknown case" state. */
export function NotFoundView({ title, body, linkLabel, href = "/" }: { title: string; body: string; linkLabel: string; href?: string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16" data-testid="not-found">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-3 text-lg text-muted">{body}</p>
      <p className="mt-6">
        <Link href={href} className="inline-flex min-h-6 items-center rounded-md bg-brand px-4 py-2 font-medium text-on-brand hover:bg-brand-strong">
          {linkLabel}
        </Link>
      </p>
    </section>
  );
}
