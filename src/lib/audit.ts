import { prisma } from "@/lib/db";

export async function logAdminAction(input: {
  actorId: string;
  targetId?: string | null;
  action: string;
  detail?: string;
  result?: string;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: input.actorId,
        targetId: input.targetId ?? undefined,
        action: input.action,
        detail: (input.detail ?? "").slice(0, 500),
        result: input.result ?? "ok",
      },
    });
  } catch (e) {
    console.error("[audit]", e instanceof Error ? e.message : "failed");
  }
}
