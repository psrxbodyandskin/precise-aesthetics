import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const size = { width: 1200, height: 630 };

async function readPublic(relPath: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(process.cwd(), "public", relPath));
  } catch {
    return null;
  }
}

export async function GET() {
  const [fraunces, inter] = await Promise.all([
    readPublic("fonts/Fraunces-Regular.ttf"),
    readPublic("fonts/Inter-Medium.ttf"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0C1426",
          padding: "72px 80px",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Monogram circle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 96,
              border: "2px solid #A8C8E8",
            }}
          >
            <div
              style={{
                fontFamily: "Fraunces",
                fontSize: 48,
                color: "#F4F0E8",
                lineHeight: 1,
                marginTop: -2,
              }}
            >
              P
            </div>
            <div
              style={{
                width: 1.5,
                height: 54,
                backgroundColor: "#A8C8E8",
                marginLeft: 4,
                marginRight: 4,
              }}
            />
            <div
              style={{
                fontFamily: "Fraunces",
                fontSize: 48,
                color: "#F4F0E8",
                lineHeight: 1,
                marginTop: -2,
              }}
            >
              A
            </div>
          </div>

          {/* Hairline divider */}
          <div
            style={{
              width: 1,
              height: 71,
              backgroundColor: "#A8C8E8",
              opacity: 0.6,
              marginLeft: 28,
              marginRight: 23,
            }}
          />

          {/* Wordmark + subtitle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Fraunces",
                fontSize: 37,
                color: "#F4F0E8",
                lineHeight: 1,
              }}
            >
              Precise Aesthetics
            </div>
            <div
              style={{
                fontFamily: "Inter",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: 4.2,
                color: "#F4F0E8",
                marginTop: 8,
              }}
            >
              CLINICAL TECHNOLOGY
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: "#FAF7F2",
            fontFamily: "Fraunces",
            fontSize: 88,
            lineHeight: 1.05,
            letterSpacing: "-0.015em",
            maxWidth: 980,
          }}
        >
          Predictable outcomes across every skin type.
        </div>

        <div
          style={{
            display: "flex",
            color: "#E8DCC4",
            fontSize: 22,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Launching August 8, 2026 &middot; Civic Opera Building &middot; Chicago
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(fraunces
          ? [
              {
                name: "Fraunces",
                data: fraunces,
                style: "normal" as const,
                weight: 400 as const,
              },
            ]
          : []),
        ...(inter
          ? [
              {
                name: "Inter",
                data: inter,
                style: "normal" as const,
                weight: 500 as const,
              },
            ]
          : []),
      ],
    },
  );
}
