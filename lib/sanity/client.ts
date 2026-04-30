import { createClient } from "next-sanity";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "placeholder";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const apiVersion = "2025-01-15";

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  token: process.env.SANITY_API_READ_TOKEN,
  perspective: "published",
});
