import { Suspense } from "react";
import { MessengerUI } from "@/components/messenger/messenger-ui";

export default function MessengerPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading chats…</p>}>
      <MessengerUI />
    </Suspense>
  );
}
