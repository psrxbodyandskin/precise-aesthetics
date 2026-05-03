import { createClient } from "next-sanity";

// Defensive env var reading. `??` only catches null/undefined; an empty
// string or a value with whitespace/escape chars (e.g. "\n" smuggled in by
// CLI env-var setters) bypasses it and trips Sanity's strict projectId
// regex validation, which kills the build at "Collecting page data" with
// `projectId can only contain only a-z, 0-9 and dashes`. Trim, validate,
// and fall back to a placeholder so the build can't fail on a malformed
// build-time env. Real production env values pass through unchanged.
const rawProjectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "").trim();
const rawDataset = (process.env.NEXT_PUBLIC_SANITY_DATASET ?? "").trim();
const rawToken = (process.env.SANITY_API_READ_TOKEN ?? "").trim();

export const projectId = /^[a-z0-9-]+$/.test(rawProjectId)
  ? rawProjectId
  : "placeholder";
export const dataset = /^[a-z0-9_-]+$/.test(rawDataset)
  ? rawDataset
  : "production";
export const apiVersion = "2025-01-15";

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  token: rawToken.length > 0 ? rawToken : undefined,
  perspective: "published",
});
