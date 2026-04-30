import { defineArrayMember, defineField, defineType } from "sanity";
import { LockIcon } from "@sanity/icons";

export const caseStudy = defineType({
  name: "caseStudy",
  title: "Case Study",
  type: "document",
  icon: LockIcon,
  description:
    "GATED. Renders only inside the practitioner portal. Requires patient consent before publishing.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "indication",
      title: "Indication",
      type: "reference",
      to: [{ type: "indication" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "protocol",
      title: "Protocol",
      type: "reference",
      to: [{ type: "protocol" }],
    }),
    defineField({
      name: "patientProfile",
      title: "Patient profile (de-identified)",
      type: "object",
      description: "No name, no DOB, no contact info. Bucketed only.",
      fields: [
        defineField({
          name: "ageRange",
          title: "Age range",
          type: "string",
          description: 'e.g., "25–34".',
        }),
        defineField({
          name: "fitzpatrick",
          title: "Fitzpatrick (1–6)",
          type: "number",
          validation: (rule) => rule.min(1).max(6).integer(),
        }),
        defineField({
          name: "presentingConcern",
          title: "Presenting concern",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "sessionCount",
      title: "Session count",
      type: "number",
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: "beforeImage",
      title: "Before image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: "afterImage",
      title: "After image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: "clinicalNarrative",
      title: "Clinical narrative",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "consentObtained",
      title: "Patient consent obtained",
      type: "boolean",
      description:
        "REQUIRED to be true to publish. Confirms documented patient consent for clinical use of images and case details.",
      initialValue: false,
      validation: (rule) =>
        rule.custom((value, context) => {
          const status = (context.document as { status?: string } | undefined)?.status;
          if (status === "published" && value !== true) {
            return "Consent must be obtained before publishing.";
          }
          return true;
        }),
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
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
    select: {
      title: "title",
      indication: "indication.title",
      status: "status",
      consent: "consentObtained",
    },
    prepare({ title, indication, status, consent }) {
      return {
        title,
        subtitle: `🔒 ${indication ?? "—"} · ${status}${consent ? "" : " · ⚠ no consent"}`,
      };
    },
  },
});
