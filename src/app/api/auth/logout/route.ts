export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { deleteSessionCookie } from "@/lib/auth";

export async function POST() {
  await deleteSessionCookie();
  return NextResponse.json({ success: true });
}

