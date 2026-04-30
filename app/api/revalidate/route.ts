import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  const secret = req.headers.get("x-sanity-secret");
  if (!secret || secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const docType =
    typeof body?._type === "string"
      ? body._type
      : typeof body?.type === "string"
        ? body.type
        : null;

  if (docType) revalidateTag(docType);
  revalidateTag("sanity");

  return NextResponse.json({ ok: true, revalidated: docType ?? "sanity" });
}
