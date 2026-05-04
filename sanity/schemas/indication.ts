import { defineField, defineType } from "sanity";

// Indication taxonomy used by:
//   - protocol.ts (every protocol references one indication)
//   - caseStudy.ts (categorization for marketing content)
//
// P4 mapping: Sanity `indication` document type → Supabase
// `public.indication_categories` table (the table name is kept
// neutral to avoid future churn). Sync handled by the Sanity
// webhook in /api/webhooks/sanity/protocol — same endpoint
// branches on `_type` to handle both indications and protocols.
export const indication = defineType({
  name: "indication",
  title: "Indication",
  type: "document",
  description:
    "Taxonomy used to categorize protocols and case studies. Indication names may appear in public marketing; protocol details never do.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: 'Clinical name. e.g., "Melasma".',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "shortDescription",
      title: "Short description",
      type: "text",
      rows: 3,
      description:
        "One sentence, ~140 characters. Used internally and may surface in marketing.",
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: "description",
      title: "Long description",
      type: "array",
      of: [{ type: "block" }],
      description:
        "Optional longform clinical description for the protocol library detail view.",
    }),
    defineField({
      name: "icon",
      title: "Lucide icon name",
      type: "string",
      description:
        "Optional Lucide icon name for UI display (e.g., 'sparkles').",
    }),
    defineField({
      name: "displayOrder",
      title: "Display order",
      type: "number",
      description: "Lower numbers sort first.",
      initialValue: 100,
    }),
    defineField({
      name: "sortOrder",
      title: "Protocol library sort order",
      type: "number",
      description:
        "Used inside the practitioner protocol library to order indication groupings. Lower numbers sort first. Falls back to displayOrder if unset.",
    }),
    defineField({
      name: "isPublic",
      title: "Show in public marketing",
      type: "boolean",
      description:
        "If true, this indication name may appear on public marketing pages. Protocol details remain gated regardless.",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "shortDescription", isPublic: "isPublic" },
    prepare({ title, subtitle, isPublic }) {
      return {
        title,
        subtitle: `${isPublic ? "Public" : "Internal"} — ${subtitle ?? ""}`.trim(),
      };
    },
  },
});
