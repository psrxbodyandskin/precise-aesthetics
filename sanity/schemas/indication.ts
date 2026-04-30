import { defineField, defineType } from "sanity";

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
      description: "One sentence, ~140 characters. Used internally and may surface in marketing.",
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: "icon",
      title: "Lucide icon name",
      type: "string",
      description: "Optional Lucide icon name for UI display (e.g., 'sparkles').",
    }),
    defineField({
      name: "displayOrder",
      title: "Display order",
      type: "number",
      description: "Lower numbers sort first.",
      initialValue: 100,
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
