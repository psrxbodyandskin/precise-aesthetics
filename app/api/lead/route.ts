import { NextResponse } from "next/server";
import { z } from "zod";

const LeadSchema = z.object({
  email: z.string().email().optional(),
  source: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = LeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 },
      );
    }
    // TODO: persist to Supabase + send Resend welcome — wired in Session 4.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
