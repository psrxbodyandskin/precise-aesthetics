// Seeds a real video file into the training-videos bucket and wires
// both Pico training modules to point at it. Lets the team test the
// portal training flow end-to-end without sourcing + uploading a
// video by hand.
//
// Usage:
//   node --env-file=.env.local scripts/seed-training-video.mjs
//
// Idempotent: re-uploading uses upsert=true, and the modules update
// every run.
//
// Source: Big Buck Bunny short clip (Creative Commons, Blender
// Foundation). Mirror: W3Schools' tutorial-grade public sample.
// ~1 MB, 10s — small enough to download fast in CI, long enough to
// scrub past the 50% required watch threshold quickly.

import { createClient } from "@supabase/supabase-js";

const VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";
const STORAGE_PATH = "seed/mov_bbb.mp4";
const DURATION_SECONDS = 10;
const SLUGS = ["welcome-precise-pico", "parameter-envelopes-endpoints"];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Run with `node --env-file=.env.local scripts/seed-training-video.mjs`.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

console.log(`Downloading ${VIDEO_URL}…`);
const res = await fetch(VIDEO_URL);
if (!res.ok) {
  console.error(`Download failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const buffer = Buffer.from(await res.arrayBuffer());
console.log(`Got ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB.`);

console.log(`Uploading to training-videos/${STORAGE_PATH}…`);
const { error: uploadError } = await supabase.storage
  .from("training-videos")
  .upload(STORAGE_PATH, buffer, {
    contentType: "video/mp4",
    upsert: true,
  });
if (uploadError) {
  console.error("Upload failed:", uploadError.message);
  process.exit(1);
}
console.log("Uploaded.");

console.log(`Wiring slugs ${SLUGS.join(", ")} to the storage path…`);
const { data: updated, error: updateError } = await supabase
  .from("training_modules")
  .update({
    video_storage_path: STORAGE_PATH,
    video_duration_seconds: DURATION_SECONDS,
  })
  .in("slug", SLUGS)
  .select("id, slug, title");

if (updateError) {
  console.error("Update failed:", updateError.message);
  process.exit(1);
}

if (!updated || updated.length === 0) {
  console.error(
    "No matching modules found. Run training-test.sql first so the slugs exist.",
  );
  process.exit(1);
}

for (const m of updated) {
  console.log(`  ✓ ${m.slug} — ${m.title} (id=${m.id})`);
}
console.log("Done. Both modules now have the Sintel trailer wired.");
