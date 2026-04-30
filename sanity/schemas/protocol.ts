import { defineArrayMember, defineField, defineType } from "sanity";
import { LockIcon } from "@sanity/icons";

export const protocol = defineType({
  name: "protocol",
  title: "Protocol",
  type: "document",
  icon: LockIcon,
  description:
    "GATED. Proprietary clinical IP. Renders only inside the practitioner portal behind authentication. Never indexed publicly.",
  groups: [
    { name: "core", title: "Core" },
    { name: "clinical", title: "Clinical" },
    { name: "treatment", title: "Treatment" },
    { name: "outcomes", title: "Outcomes" },
    { name: "meta", title: "Meta" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: 'e.g., "Melasma — Fitzpatrick IV–VI".',
      group: "core",
      validation: (rule) => rule.required().max(140),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "core",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "indication",
      title: "Indication",
      type: "reference",
      to: [{ type: "indication" }],
      group: "core",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "fitzpatrickRange",
      title: "Fitzpatrick range",
      type: "object",
      group: "clinical",
      fields: [
        defineField({
          name: "min",
          title: "Min (1–6)",
          type: "number",
          validation: (rule) => rule.required().min(1).max(6).integer(),
        }),
        defineField({
          name: "max",
          title: "Max (1–6)",
          type: "number",
          validation: (rule) => rule.required().min(1).max(6).integer(),
        }),
      ],
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return "Fitzpatrick range is required";
          const v = value as { min?: number; max?: number };
          if (v.min === undefined || v.max === undefined) return "Both min and max are required";
          if (v.max < v.min) return "Max must be greater than or equal to min";
          return true;
        }),
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      group: "clinical",
      options: {
        list: [
          { title: "Foundational", value: "foundational" },
          { title: "Intermediate", value: "intermediate" },
          { title: "Advanced", value: "advanced" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "estimatedSessions",
      title: "Estimated sessions",
      type: "object",
      group: "clinical",
      fields: [
        defineField({ name: "min", title: "Min", type: "number", validation: (r) => r.min(1).integer() }),
        defineField({ name: "max", title: "Max", type: "number", validation: (r) => r.min(1).integer() }),
      ],
    }),
    defineField({
      name: "sessionInterval",
      title: "Session interval",
      type: "string",
      group: "clinical",
      description: 'e.g., "4–6 weeks".',
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      group: "core",
      description: "2–3 sentences. Plain text. Shown at the top of the protocol detail page.",
      validation: (rule) => rule.max(500),
    }),
    defineField({
      name: "clinicalRationale",
      title: "Clinical rationale",
      type: "array",
      group: "clinical",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "parameters",
      title: "Parameters",
      type: "array",
      group: "treatment",
      of: [
        defineArrayMember({
          type: "object",
          name: "parameter",
          fields: [
            defineField({
              name: "parameterName",
              title: "Parameter",
              type: "string",
              description: 'e.g., "Wavelength", "Fluence", "Spot size".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "value",
              title: "Value",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "notes", title: "Notes", type: "string" }),
          ],
          preview: {
            select: { title: "parameterName", subtitle: "value" },
          },
        }),
      ],
    }),
    defineField({
      name: "technique",
      title: "Technique",
      type: "array",
      group: "treatment",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "preTreatment",
      title: "Pre-treatment",
      type: "array",
      group: "treatment",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "postTreatment",
      title: "Post-treatment",
      type: "array",
      group: "treatment",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "kitRecommendation",
      title: "Kit recommendation",
      type: "string",
      group: "treatment",
      description: "Optional reference to a biologic control kit.",
    }),
    defineField({
      name: "contraindications",
      title: "Contraindications",
      type: "array",
      group: "clinical",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "expectedOutcomes",
      title: "Expected outcomes",
      type: "array",
      group: "outcomes",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "complications",
      title: "Complications",
      type: "array",
      group: "outcomes",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "relatedProtocols",
      title: "Related protocols",
      type: "array",
      group: "meta",
      of: [defineArrayMember({ type: "reference", to: [{ type: "protocol" }] })],
    }),
    defineField({
      name: "clinicalReferences",
      title: "Clinical references",
      type: "array",
      group: "meta",
      of: [
        defineArrayMember({
          type: "object",
          name: "clinicalReference",
          fields: [
            defineField({
              name: "citation",
              title: "Citation",
              type: "text",
              rows: 2,
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "url", title: "URL", type: "url" }),
          ],
          preview: { select: { title: "citation" } },
        }),
      ],
    }),
    defineField({
      name: "lastReviewed",
      title: "Last reviewed",
      type: "date",
      group: "meta",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "meta",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Published", value: "published" },
          { title: "Archived", value: "archived" },
        ],
        layout: "radio",
      },
      initialValue: "draft",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "title", indication: "indication.title", status: "status" },
    prepare({ title, indication, status }) {
      return {
        title,
        subtitle: `🔒 ${indication ?? "—"} · ${status}`,
      };
    },
  },
});
