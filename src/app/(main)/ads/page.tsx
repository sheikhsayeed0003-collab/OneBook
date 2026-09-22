"use client";

import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdsPage() {
  return (
    <div>
      <PageHero
        title="Ads manager"
        subtitle="Campaigns, budget, targeting, impressions, CTR"
        actions={
          <Button onClick={() => toast.message("Paid ads billing is not enabled on this instance")}>Create ad</Button>
        }
      />
      <p className="rounded-xl bg-card p-4 text-sm text-muted-foreground shadow-sm">
        No ad campaigns. This product does not run a paid ads network yet.
      </p>
    </div>
  );
}
