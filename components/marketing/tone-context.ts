export type SectionTone = "bone" | "midnight" | "midnight-deep" | "champagne";

export function isDarkTone(tone: SectionTone): boolean {
  return tone === "midnight" || tone === "midnight-deep";
}
