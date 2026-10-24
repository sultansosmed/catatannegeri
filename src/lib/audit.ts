import { db } from "./db";

export async function logAuditEvent({
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
  userAgent,
}: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any> | string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        details: typeof details === "object" ? JSON.stringify(details) : details,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

