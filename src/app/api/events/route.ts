import { NextResponse } from "next/server";
import { getActiveEvents } from "@/services/dataService";

export async function GET() {
  try {
    const events = await getActiveEvents();
    return NextResponse.json({ events });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
