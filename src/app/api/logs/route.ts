import { NextResponse } from "next/server";
import { getSystemLogs } from "@/services/dataService";

export async function GET() {
  try {
    const logs = await getSystemLogs();
    return NextResponse.json({ logs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
