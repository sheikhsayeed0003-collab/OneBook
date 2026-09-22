import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-states";

export default function ActivityPage() {
  const rows = [
    "You reacted Love to Aya’s photo · 12m",
    "You commented on Sara’s post · 1h",
    "You joined Dhaka Photographers · yesterday",
    "You updated profile photo · 3d",
  ];
  return (
    <div>
      <PageHero title="Activity log" subtitle="A private history of your actions" />
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r} className="rounded-xl bg-card p-3 text-sm shadow-sm">
            {r}
          </li>
        ))}
      </ul>
      <EmptyState className="mt-4" title="That’s everything" description="Older activity will appear here as you use OneBook." />
    </div>
  );
}
