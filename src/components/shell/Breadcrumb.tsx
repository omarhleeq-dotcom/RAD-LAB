import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export interface Crumb {
  label: string;
  /** Locale-less path; omitted for the current page. */
  href?: string;
}

/** Logical-order trail (Home › X-ray › Chest PA › Practice); RTL mirrors through the document direction. */
export async function Breadcrumb({ items }: { items: Crumb[] }) {
  const t = await getTranslations("common");
  const trail: Crumb[] = [{ label: t("home"), href: "/" }, ...items];
  return (
    <nav aria-label={t("breadcrumb")} className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {trail.map((c, i) => (
          <li key={`${i}-${c.label}`} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden="true" className="text-muted rtl:-scale-x-100">
                ›
              </span>
            )}
            {c.href !== undefined && i < trail.length - 1 ? (
              <Link href={c.href} className="inline-flex min-h-6 items-center text-brand hover:underline">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-ink">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
