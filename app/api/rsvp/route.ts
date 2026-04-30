import { NextResponse } from "next/server";
import { z } from "zod";

const RSVPSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  guests: z.number().int().min(0).max(2).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = RSVPSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 },
      );
    }
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
