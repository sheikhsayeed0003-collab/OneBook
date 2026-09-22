import { PageHero } from "@/components/page-hero";
import { appConfig } from "@/lib/config";

export default function HelpPage() {
  return (
    <div>
      <PageHero title="Help Center" subtitle={`Reach us at ${appConfig.supportEmail}`} />
      <div className="grid gap-3 md:grid-cols-2">
        {["Login & password", "Privacy", "Messaging", "Marketplace safety", "Report a problem", "Community standards"].map(
          (t) => (
            <article key={t} className="rounded-xl bg-card p-4 shadow-sm">
              <h2 className="font-semibold">{t}</h2>
              <p className="text-sm text-muted-foreground">Guides and policies for this topic.</p>
            </article>
          ),
        )}
      </div>
    </div>
  );
}
